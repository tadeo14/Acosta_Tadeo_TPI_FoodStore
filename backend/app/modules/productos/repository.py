from typing import Sequence

from sqlmodel import Session, col, func, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def search(
        self,
        *,
        skip: int,
        limit: int,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
    ) -> tuple[int, Sequence[Producto]]:
        """Productos activos filtrados por nombre (sin distinguir mayúsculas), categoría y disponibilidad."""
        condiciones = [col(Producto.activo).is_(True)]
        if search:
            condiciones.append(func.lower(Producto.nombre).contains(search.strip().lower()))
        if categoria_id is not None:
            condiciones.append(col(Producto.categoria_id) == categoria_id)
        if disponible is not None:
            condiciones.append(col(Producto.disponible).is_(disponible))

        total = self.session.exec(select(func.count()).select_from(Producto).where(*condiciones)).one()
        items = self.session.exec(
            select(Producto).where(*condiciones).order_by(col(Producto.id)).offset(skip).limit(limit)
        ).all()
        return int(total), items
