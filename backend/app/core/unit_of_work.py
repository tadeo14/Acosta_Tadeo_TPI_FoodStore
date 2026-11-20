from types import TracebackType
from typing import Callable

from sqlmodel import Session

from app.core.database import session_factory


class UnitOfWork:
    """Unit of Work base.

    Abre la sesión en __enter__ y en __exit__ hace commit si no hubo
    excepción o rollback si la hubo; siempre cierra la sesión.
    Los Unit of Work de cada módulo heredan de esta clase y crean sus
    repositorios sobre la misma sesión en `_crear_repositorios`.
    """

    session: Session

    def __init__(self, factory: Callable[[], Session] = session_factory) -> None:
        self._factory = factory

    def __enter__(self) -> "UnitOfWork":
        self.session = self._factory()
        self._crear_repositorios()
        return self

    def _crear_repositorios(self) -> None:
        """Se sobrescribe en cada módulo."""

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        finally:
            self.session.close()
