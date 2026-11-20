from datetime import datetime
from typing import Sequence

from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def add_detalle(self, detalle: DetallePedido) -> DetallePedido:
        self.session.add(detalle)
        self.session.flush()
        return detalle

    def _listar(self, condiciones: list, skip: int, limit: int) -> tuple[int, Sequence[Pedido]]:  # type: ignore[type-arg]
        total = self.session.exec(select(func.count()).select_from(Pedido).where(*condiciones)).one()
        items = self.session.exec(
            select(Pedido).where(*condiciones).order_by(col(Pedido.created_at).desc(), col(Pedido.id).desc()).offset(skip).limit(limit)
        ).all()
        return int(total), items

    def list_by_usuario(
        self, usuario_id: int, skip: int, limit: int, estado: str | None = None
    ) -> tuple[int, Sequence[Pedido]]:
        condiciones = [col(Pedido.usuario_id) == usuario_id]
        if estado:
            condiciones.append(col(Pedido.estado) == estado)
        return self._listar(condiciones, skip, limit)

    def list_all(self, skip: int, limit: int, estado: str | None = None) -> tuple[int, Sequence[Pedido]]:
        condiciones = [col(Pedido.estado) == estado] if estado else []
        return self._listar(condiciones, skip, limit)

    def count_by_estado(self) -> dict[str, int]:
        filas = self.session.exec(select(Pedido.estado, func.count()).group_by(Pedido.estado)).all()
        return {estado: int(cantidad) for estado, cantidad in filas}

    def count_desde(self, desde: datetime) -> int:
        return int(self.session.exec(select(func.count()).select_from(Pedido).where(col(Pedido.created_at) >= desde)).one())

    def sum_total_por_estado(self, estado: str) -> float:
        valor = self.session.exec(select(func.coalesce(func.sum(Pedido.total), 0)).where(col(Pedido.estado) == estado)).one()
        return float(valor)
