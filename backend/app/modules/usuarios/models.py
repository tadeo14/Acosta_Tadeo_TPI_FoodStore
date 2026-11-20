from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.pedidos.models import Pedido


class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, max_length=50)
    full_name: str = Field(max_length=120)
    email: str = Field(index=True, unique=True, max_length=255)
    hashed_password: str
    role: str = Field(default="user", max_length=10)  # "user" | "admin"
    disabled: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.now)

    pedidos: list["Pedido"] = Relationship(back_populates="usuario")
