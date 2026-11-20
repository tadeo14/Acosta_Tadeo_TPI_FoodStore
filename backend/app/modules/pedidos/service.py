from datetime import datetime

from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    CambioEstado,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.usuarios.models import Usuario


# ── Excepciones de dominio ──────────────────────────────────────────────
class ReglaDeNegocio(Exception):
    """Base de las violaciones de reglas de negocio (→ 400)."""


class PedidoNoEncontrado(Exception):
    def __init__(self, pedido_id: int) -> None:
        super().__init__(f"Pedido {pedido_id} no encontrado")


class ProductoNoEncontrado(Exception):
    def __init__(self, producto_id: int) -> None:
        super().__init__(f"Producto {producto_id} no encontrado o inactivo")


class PedidoAjeno(Exception):
    def __init__(self) -> None:
        super().__init__("No tenés permiso para acceder a este pedido")


class ProductoRepetido(ReglaDeNegocio):
    def __init__(self, producto_id: int) -> None:
        super().__init__(f"El producto {producto_id} está repetido en el pedido")


class ProductoNoDisponible(ReglaDeNegocio):
    def __init__(self, nombre: str) -> None:
        super().__init__(f"El producto '{nombre}' no está disponible")


class StockInsuficiente(ReglaDeNegocio):
    def __init__(self, nombre: str, disponible: int, pedido: int) -> None:
        super().__init__(f"Stock insuficiente para '{nombre}': disponible {disponible}, pedido {pedido}")


class TransicionInvalida(ReglaDeNegocio):
    def __init__(self, actual: str, nuevo: str) -> None:
        super().__init__(f"Transición inválida: {actual} → {nuevo}")


class CancelacionNoPermitida(ReglaDeNegocio):
    def __init__(self, estado: str) -> None:
        super().__init__(f"Solo se puede cancelar un pedido en PENDIENTE (estado actual: {estado})")


# ── Máquina de estados (RN-02) ──────────────────────────────────────────
TRANSICIONES: dict[str, set[str]] = {
    "PENDIENTE": {"EN_PREPARACION", "CANCELADO"},
    "EN_PREPARACION": {"ENTREGADO", "CANCELADO"},
    "ENTREGADO": set(),  # terminal
    "CANCELADO": set(),  # terminal
}


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    # ── helpers ─────────────────────────────────────────────────────────
    @staticmethod
    def _get_pedido(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(pedido_id)
        return pedido

    @staticmethod
    def _restituir_stock(uow: PedidoUnitOfWork, pedido: Pedido) -> None:
        """RN-03: devuelve al stock la cantidad de cada línea (misma transacción)."""
        for linea in pedido.items:
            producto = uow.productos.get_by_id(linea.producto_id)
            if producto is not None:
                producto.stock += linea.cantidad
                uow.session.add(producto)

    @staticmethod
    def _aplicar_estado(pedido: Pedido, nuevo: str) -> None:
        if nuevo not in TRANSICIONES.get(pedido.estado, set()):
            raise TransicionInvalida(pedido.estado, nuevo)
        pedido.estado = nuevo
        pedido.updated_at = datetime.now()

    # ── RN-01: crear pedido ─────────────────────────────────────────────
    def crear(self, datos: PedidoCreate, usuario: Usuario) -> PedidoRead:
        assert usuario.id is not None
        with self.uow as uow:
            ids = [item.producto_id for item in datos.items]
            vistos: set[int] = set()
            for pid in ids:
                if pid in vistos:
                    raise ProductoRepetido(pid)
                vistos.add(pid)

            pedido = Pedido(
                usuario_id=usuario.id,
                estado="PENDIENTE",
                forma_pago=datos.forma_pago,
                direccion_entrega=datos.direccion_entrega.strip(),
                notas=datos.notas,
                total=0,
            )
            uow.pedidos.add(pedido)
            assert pedido.id is not None

            total = 0.0
            for item in datos.items:
                producto = uow.productos.get_by_id(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(item.producto_id)
                if not producto.disponible:
                    raise ProductoNoDisponible(producto.nombre)
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(producto.nombre, producto.stock, item.cantidad)

                producto.stock -= item.cantidad  # descuento en la misma iteración
                uow.session.add(producto)

                subtotal = round(producto.precio_base * item.cantidad, 2)
                uow.pedidos.add_detalle(
                    DetallePedido(
                        pedido_id=pedido.id,
                        producto_id=item.producto_id,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,  # copia
                        precio_unitario=producto.precio_base,  # copia
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.session.add(pedido)
            uow.session.flush()
            uow.session.refresh(pedido)
            return PedidoRead.model_validate(pedido)
        # Si algo falla, __exit__ hace rollback: no se persiste ni el pedido ni el descuento de stock.

    # ── consultas ───────────────────────────────────────────────────────
    def listar(self, usuario: Usuario, skip: int, limit: int, estado: str | None) -> PedidosPaginados:
        assert usuario.id is not None
        with self.uow as uow:
            if usuario.role == "admin":
                total, pedidos = uow.pedidos.list_all(skip, limit, estado)
            else:
                total, pedidos = uow.pedidos.list_by_usuario(usuario.id, skip, limit, estado)
            return PedidosPaginados(total=total, items=[PedidoRead.model_validate(p) for p in pedidos])

    def obtener(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get_pedido(uow, pedido_id)
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:  # RN-04
                raise PedidoAjeno()
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            conteos = uow.pedidos.count_by_estado()
            inicio_hoy = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            return ResumenPedidos(
                pendientes=conteos.get("PENDIENTE", 0),
                en_preparacion=conteos.get("EN_PREPARACION", 0),
                entregados=conteos.get("ENTREGADO", 0),
                cancelados=conteos.get("CANCELADO", 0),
                pedidos_hoy=uow.pedidos.count_desde(inicio_hoy),
                ingresos_entregados=round(uow.pedidos.sum_total_por_estado("ENTREGADO"), 2),
            )

    # ── RN-02 / RN-03: cambio de estado (admin) ─────────────────────────
    def cambiar_estado(self, pedido_id: int, datos: CambioEstado) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get_pedido(uow, pedido_id)
            self._aplicar_estado(pedido, datos.estado)  # valida antes de modificar
            if datos.estado == "CANCELADO":
                self._restituir_stock(uow, pedido)
            uow.session.add(pedido)
            uow.session.flush()
            return PedidoRead.model_validate(pedido)

    # ── RN-03 / RN-04: cancelación por el dueño ─────────────────────────
    def cancelar(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get_pedido(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno()
            if pedido.estado != "PENDIENTE":
                raise CancelacionNoPermitida(pedido.estado)
            self._aplicar_estado(pedido, "CANCELADO")
            self._restituir_stock(uow, pedido)
            uow.session.add(pedido)
            uow.session.flush()
            return PedidoRead.model_validate(pedido)
