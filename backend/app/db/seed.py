"""Seed idempotente: crea el admin, categorías y productos si no existen.

Uso:  python -m app.db.seed
"""

from sqlmodel import Session, select

from app.core.database import create_all_tables, engine
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.pedidos import models as _pedidos  # noqa: F401  (registra las tablas de pedidos)
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

ADMIN = {
    "username": "admin",
    "full_name": "Administrador Food Store",
    "email": "admin@foodstore.com",
    "password": "Admin1234!",
}

CATEGORIAS: list[tuple[str, str]] = [
    ("Hamburguesas", "Hamburguesas caseras con papas"),
    ("Pizzas", "Pizzas a la piedra"),
    ("Empanadas", "Empanadas al horno"),
    ("Bebidas", "Gaseosas, aguas y jugos"),
    ("Postres", "Postres y helados"),
]

# (categoria, nombre, descripcion, precio, stock, imagen)
PRODUCTOS: list[tuple[str, str, str, float, int, str]] = [
    ("Hamburguesas", "Hamburguesa clásica", "Carne, lechuga, tomate y queso", 8500, 25,
     "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600"),
    ("Hamburguesas", "Hamburguesa doble cheddar", "Doble carne, doble cheddar y panceta", 11200, 15,
     "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600"),
    ("Pizzas", "Pizza muzzarella", "Salsa de tomate, muzzarella y aceitunas", 9800, 20,
     "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600"),
    ("Pizzas", "Pizza napolitana", "Muzzarella, tomate en rodajas y ajo", 10900, 12,
     "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600"),
    ("Empanadas", "Empanada de carne", "Carne cortada a cuchillo", 1500, 60,
     "https://images.unsplash.com/photo-1601000938259-9e92002320b2?w=600"),
    ("Empanadas", "Empanada de jamón y queso", "Jamón cocido y muzzarella", 1400, 50,
     "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600"),
    ("Bebidas", "Gaseosa cola 500 ml", "Botella individual", 2200, 80,
     "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600"),
    ("Bebidas", "Agua mineral 500 ml", "Sin gas", 1600, 80,
     "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600"),
    ("Postres", "Flan casero", "Con dulce de leche", 3500, 18,
     "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600"),
    ("Postres", "Helado 1/4 kg", "Dos gustos a elección", 4800, 30,
     "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600"),
]


def seed() -> None:
    create_all_tables()
    with Session(engine) as session:
        # Admin
        if session.exec(select(Usuario).where(Usuario.username == ADMIN["username"])).first() is None:
            session.add(
                Usuario(
                    username=ADMIN["username"],
                    full_name=ADMIN["full_name"],
                    email=ADMIN["email"],
                    hashed_password=hash_password(ADMIN["password"]),
                    role="admin",
                )
            )
            print("✔ Usuario admin creado")
        else:
            print("· Usuario admin ya existía")

        # Categorías
        categorias: dict[str, Categoria] = {}
        for nombre, descripcion in CATEGORIAS:
            cat = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
            if cat is None:
                cat = Categoria(nombre=nombre, descripcion=descripcion)
                session.add(cat)
                session.flush()
                print(f"✔ Categoría '{nombre}' creada")
            categorias[nombre] = cat

        # Productos
        for cat_nombre, nombre, descripcion, precio, stock, imagen in PRODUCTOS:
            existe = session.exec(select(Producto).where(Producto.nombre == nombre)).first()
            if existe is None:
                categoria = categorias[cat_nombre]
                assert categoria.id is not None
                session.add(
                    Producto(
                        categoria_id=categoria.id,
                        nombre=nombre,
                        descripcion=descripcion,
                        precio_base=precio,
                        stock=stock,
                        imagen_url=imagen,
                    )
                )
                print(f"✔ Producto '{nombre}' creado")

        session.commit()
    print("Seed finalizado.")


if __name__ == "__main__":
    seed()
