"""
API del expediente clínico (Medora).

Solo escucha en 127.0.0.1: la consume el servidor de Next.js, nunca el navegador.
Cada petición debe traer la cabecera `X-API-Key` con la clave de `.env.local` (MEDORA_API_KEY).

    npm run api
"""

from __future__ import annotations

import secrets
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException

from .db import init_db
from .routers import expedientes, oncologia
from .settings import API_KEY


def require_key(x_api_key: str | None = Header(default=None)) -> None:
    if not API_KEY:
        raise HTTPException(503, "Falta MEDORA_API_KEY en .env.local.")
    if not x_api_key or not secrets.compare_digest(x_api_key, API_KEY):
        raise HTTPException(401, "Clave de API no válida.")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Medora · API del expediente clínico", version="1.0.0", dependencies=[Depends(require_key)], lifespan=lifespan)
app.include_router(expedientes.router)
app.include_router(oncologia.router)


@app.get("/salud", tags=["sistema"])
def health() -> dict[str, str]:
    return {"estado": "ok"}
