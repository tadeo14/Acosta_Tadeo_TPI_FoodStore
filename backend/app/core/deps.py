from typing import Callable

from fastapi import Depends, HTTPException, Request, status

from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

COOKIE_NAME = "access_token"
CUENTA_DESACTIVADA = "Cuenta de usuario desactivada"


def get_current_user(request: Request) -> Usuario:
    """Lee el JWT de la cookie HttpOnly, valida firma y expiración y carga el usuario."""
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado o sesión expirada",
    )
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise credenciales_invalidas
    username = decode_access_token(token)
    if username is None:
        raise credenciales_invalidas

    with UsuarioUnitOfWork() as uow:
        usuario = uow.usuarios.get_by_username(username)
        if usuario is None:
            raise credenciales_invalidas
        uow.session.expunge(usuario)  # se usa fuera de la sesión (solo lectura)
    return usuario


def get_current_active_user(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    if usuario.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=CUENTA_DESACTIVADA)
    return usuario


def require_role(roles: list[str]) -> Callable[[Usuario], Usuario]:
    """Dependencia parametrizada: 403 si el rol del usuario no está permitido."""

    def _verificar(usuario: Usuario = Depends(get_current_active_user)) -> Usuario:
        if usuario.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permisos para realizar esta acción",
            )
        return usuario

    return _verificar
