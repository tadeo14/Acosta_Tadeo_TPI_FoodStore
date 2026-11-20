from typing import Generic, Sequence, TypeVar

from sqlmodel import Session, SQLModel, select

T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    """Operaciones genéricas de acceso a datos. Sin reglas de negocio ni commit."""

    def __init__(self, session: Session, model: type[T]) -> None:
        self.session = session
        self.model = model

    def get_by_id(self, id_: int) -> T | None:
        return self.session.get(self.model, id_)

    def get_all(self) -> Sequence[T]:
        return self.session.exec(select(self.model)).all()

    def add(self, entity: T) -> T:
        self.session.add(entity)
        self.session.flush()  # asigna el id sin confirmar la transacción
        return entity

    def delete(self, entity: T) -> None:
        self.session.delete(entity)
        self.session.flush()
