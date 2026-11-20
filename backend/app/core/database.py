from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

_es_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if _es_sqlite else {},
)

if _es_sqlite:

    @event.listens_for(Engine, "connect")
    def _activar_fk_sqlite(dbapi_connection, _connection_record) -> None:  # type: ignore[no-untyped-def]
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def session_factory() -> Session:
    """Crea una sesión nueva. La usa el Unit of Work."""
    return Session(engine)


def create_all_tables() -> None:
    """Importa todos los modelos y crea las tablas que falten."""
    # Los imports registran las tablas en SQLModel.metadata
    from app.modules.categorias import models as _categorias  # noqa: F401
    from app.modules.pedidos import models as _pedidos  # noqa: F401
    from app.modules.productos import models as _productos  # noqa: F401
    from app.modules.usuarios import models as _usuarios  # noqa: F401

    SQLModel.metadata.create_all(engine)
