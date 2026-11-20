from sqlmodel import SQLModel

# El registro reutiliza UserCreate / UserPublic del módulo usuarios.
from app.modules.usuarios.schemas import UserCreate, UserPublic

__all__ = ["UserCreate", "UserPublic", "MensajeResponse"]


class MensajeResponse(SQLModel):
    message: str
