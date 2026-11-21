# Food Store — TPI Programación 4

Aplicación web para un negocio de comidas: los clientes recorren el catálogo, arman un carrito y confirman pedidos; el administrador gestiona categorías, productos, stock, pedidos y usuarios.

- **Alumno:** Tadeo Acosta
- **Materia:** Programación 4 — Tecnicatura Universitaria en Programación a Distancia (UTN)
- **Repositorio:**- **Repositorio:** https://github.com/tadeo14/Acosta_Tadeo_TPI_FoodStore
- **Video de demostración:** https://youtu.be/TU-VIDEO  <!-- TODO: reemplazar por el link público -->

---

## Stack

| Parte | Tecnologías |
|---|---|
| Backend | Python 3.11–3.13, FastAPI, SQLModel, PostgreSQL (psycopg2), python-jose (JWT), passlib + bcrypt, pydantic-settings |
| Frontend | React 19 + TypeScript (strict), Vite 7, Tailwind CSS 4, TanStack Query / Form / Table, React Router 7, Zustand, Axios |

## Requisitos

- **Python 3.11, 3.12 o 3.13** (SQLModel 0.0.22 no funciona con 3.14)
- **PostgreSQL 15 o superior** (para una prueba rápida se puede usar SQLite, ver más abajo)
- **Node.js 20.19 o superior** y **pnpm 9 o superior** (`npm install -g pnpm`)

---

## 1. Backend

```bash
cd backend

# Crear y activar el entorno virtual
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Instalar dependencias (versiones fijadas)
pip install -r requirements.txt

# Variables de entorno
cp .env.example .env          # en PowerShell: Copy-Item .env.example .env
```

Crear la base de datos en PostgreSQL (una sola vez) y ajustar `DATABASE_URL` en `backend/.env` con tu usuario y contraseña:

```sql
CREATE DATABASE foodstore_db;
```

Cargar datos iniciales y levantar la API:

```bash
python -m app.db.seed          # crea tablas, admin, 5 categorías y 10 productos (idempotente)
uvicorn app.main:app --reload
```

- API: http://localhost:8000/api/v1
- Documentación Swagger: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

> **Alternativa sin PostgreSQL:** en `backend/.env` poner `DATABASE_URL=sqlite:///./foodstore.db` y repetir el seed.

### Variables de entorno del backend (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a la base | `postgresql://user:pass@localhost:5432/foodstore_db` |
| `SECRET_KEY` | Clave para firmar el JWT (mínimo 32 caracteres) | `cambiar-esta-clave-de-al-menos-32-caracteres` |
| `ALGORITHM` | Algoritmo del JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token y de la cookie | `30` |
| `FRONTEND_ORIGIN` | Origen permitido en CORS (con credenciales) | `http://localhost:5173` |

---

## 2. Frontend

En otra terminal:

```bash
cd frontend
cp .env.example .env           # en PowerShell: Copy-Item .env.example .env
pnpm install
pnpm build                     # verifica los tipos (tsc) y compila
pnpm dev
```

App: http://localhost:5173

### Variables de entorno del frontend (`frontend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `http://localhost:8000/api/v1` |

> Importante: abrir el frontend en `http://localhost:5173` (no en `127.0.0.1`) para que coincida con `FRONTEND_ORIGIN` y el navegador envíe la cookie de sesión.

---

## Usuario administrador (seed)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | `admin` |

Los clientes se crean desde la pantalla **Registrarse** (rol `user`).

---

## Arquitectura

### Backend: capas por módulo

```
backend/app/
├── main.py                 FastAPI, CORS con credenciales, routers bajo /api/v1
├── core/
│   ├── config.py           Settings (pydantic-settings, lee .env)
│   ├── database.py         engine, create_all_tables, session_factory
│   ├── security.py         hash bcrypt, create/decode_access_token
│   ├── deps.py             get_current_user (lee la cookie), get_current_active_user, require_role
│   ├── unit_of_work.py     UnitOfWork: abre sesión en __enter__; commit/rollback/close en __exit__
│   └── base_repository.py  BaseRepository[T]: get_by_id, get_all, add, delete
├── modules/
│   ├── auth/               router, service, schemas (usa el modelo Usuario)
│   ├── usuarios/           models, schemas, repository, unit_of_work, service, router
│   ├── categorias/         ídem
│   ├── productos/          ídem
│   └── pedidos/            ídem (dominio central)
└── db/seed.py              seed idempotente
```

Flujo: **Router → Service → Unit of Work → Repository → Model**. El Router obtiene el Service con `Depends(get_<modulo>_service)` y traduce las excepciones de dominio a `HTTPException`; el Service abre `with self.uow as uow:` y devuelve el schema de salida dentro del bloque; **ningún Service ni Router llama a `session.commit()`**: el commit (o rollback) ocurre en `__exit__`.

### Reglas de negocio de pedidos

- **RN-01:** el pedido se crea en una sola transacción. Por cada ítem se valida que el producto exista y esté activo (404), que esté disponible y tenga stock (400), se descuenta el stock y se crea la línea con **copia** de `nombre_producto` y `precio_unitario`. Si algo falla, el rollback deshace todo, incluido el descuento de stock.
- **RN-02:** máquina de estados `PENDIENTE → EN_PREPARACION | CANCELADO`, `EN_PREPARACION → ENTREGADO | CANCELADO`; `ENTREGADO` y `CANCELADO` son terminales. Una transición inválida responde 400.
- **RN-03:** al cancelar se restituye el stock en la misma transacción.
- **RN-04:** el cliente solo ve y cancela sus pedidos (403 si es ajeno), y solo en `PENDIENTE`; el admin ve todos y avanza o cancela.
- **RN-05:** líneas y total inmutables; no hay endpoints de edición ni borrado de pedidos.
- **RN-06:** `forma_pago` ∈ {EFECTIVO, TRANSFERENCIA} y `direccion_entrega` de 5 a 200 caracteres (validado en el schema).

### Autenticación

`POST /auth/token` (formulario OAuth2) devuelve `{"message": "Login exitoso"}` y deja el JWT en la cookie **HttpOnly** `access_token` (30 min). El frontend nunca lee ni guarda el token: Axios usa `withCredentials: true`. Errores: 409 registro duplicado, 401 credenciales incorrectas / sin sesión, 400 cuenta desactivada, 403 rol no permitido.

### Frontend: organización por features

```
frontend/src/
├── shared/      api (axiosInstance, handleApiError, queryClient), ui, components, layout, hooks, utils
├── features/    auth · categorias · productos · usuarios · pedidos  (pages, components, hooks, api, types)
├── store/       authStore (sesión) y cartStore (carrito), Zustand + persist
├── routes/      AppRouter y ProtectedRoute (sin sesión → /login; sin rol → /unauthorized)
├── App.tsx      checkSession al montar
└── main.tsx     QueryClientProvider
```

- **Estado del servidor** con TanStack Query (`useQuery`, `useMutation` e `invalidateQueries`).
- **Estado del cliente** con Zustand: `authStore` persiste solo el usuario (`partialize`), nunca el token; `cartStore` persiste el carrito.
- **Interceptor de Axios:** ante un 401 (fuera de `/auth/token` y `/auth/me`) o una cuenta desactivada, limpia la sesión y `ProtectedRoute` redirige a `/login`.

---

## Endpoints

| Método | Endpoint | Acceso |
|---|---|---|
| POST | `/auth/register` · `/auth/token` · `/auth/logout` | Público |
| GET | `/auth/me` | Sesión |
| GET | `/admin/usuarios` | admin |
| POST | `/admin/usuarios/{id}/activar` · `/admin/usuarios/{id}/desactivar` | admin |
| GET | `/categorias` · `/categorias/{id}` | Público |
| POST / PUT / DELETE | `/categorias` · `/categorias/{id}` | admin |
| GET | `/productos?skip&limit&search&categoria_id&disponible` · `/productos/{id}` | Público |
| POST / PUT / DELETE | `/productos` · `/productos/{id}` | admin |
| PATCH | `/productos/{id}/stock` | admin |
| POST / GET | `/pedidos` | Sesión |
| GET | `/pedidos/resumen` | admin |
| GET | `/pedidos/{id}` | Dueño o admin |
| PATCH | `/pedidos/{id}/estado` | admin |
| PATCH | `/pedidos/{id}/cancelar` | Dueño |

Todos bajo el prefijo `/api/v1`. El detalle completo está en `/docs`.
