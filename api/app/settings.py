"""
Configuración de la API. Lee las variables de entorno o, si no existen, el `.env.local` de la raíz
del proyecto (el mismo que usa Next.js), para que ambos procesos compartan la misma clave.
"""

from __future__ import annotations

import os
from pathlib import Path

API_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = API_DIR.parent
DATA_DIR = Path(os.environ.get("MEDORA_DATA_DIR", API_DIR / "data"))
DB_PATH = DATA_DIR / "medora.db"
FILES_DIR = DATA_DIR / "archivos"

MAX_UPLOAD_BYTES = 20 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/tiff", "image/bmp", "image/webp"}


def _read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


_env_file = _read_env_file(PROJECT_DIR / ".env.local")


def setting(name: str, default: str | None = None) -> str | None:
    return os.environ.get(name) or _env_file.get(name) or default


API_KEY = setting("MEDORA_API_KEY")
