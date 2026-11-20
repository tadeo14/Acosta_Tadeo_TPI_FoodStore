from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioUnitOfWork(UnitOfWork):
    usuarios: UsuarioRepository

    def __enter__(self) -> "UsuarioUnitOfWork":
        super().__enter__()
        return self

    def _crear_repositorios(self) -> None:
        self.usuarios = UsuarioRepository(self.session)
