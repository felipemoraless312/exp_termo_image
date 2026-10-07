"""
Base de datos SQLite del expediente clínico.

La ficha de identificación y el expediente (historia clínica, notas, signos, tratamiento, estudios...)
se guardan como documentos JSON con el mismo modelo que usa la aplicación web (`modules/patients/types.ts`).
El expediente lleva un número de versión para detectar escrituras simultáneas (bloqueo optimista).

Oncología, campañas, encuestas y archivos tienen tablas propias porque la API los valida y calcula.
La bitácora (NOM-024-SSA3-2012) es de solo inserción: los triggers impiden editarla o borrarla.
"""

from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Iterator

from .settings import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  record TEXT NOT NULL UNIQUE,
  curp TEXT,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS patients_curp ON patients(curp) WHERE curp IS NOT NULL;

CREATE TABLE IF NOT EXISTS records (
  patient_id TEXT PRIMARY KEY REFERENCES patients(id),
  data TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS folios (
  prefix TEXT PRIMARY KEY,
  last INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_entity ON audit(entity_id, at);
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT, 'La bitácora es de solo inserción'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT, 'La bitácora es de solo inserción'); END;

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),
  time TEXT NOT NULL,
  visit TEXT NOT NULL,
  status TEXT NOT NULL,
  origin TEXT NOT NULL,
  checked_in_at TEXT,
  completed_at TEXT,
  notes TEXT,
  source TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (campaign_id, patient_id)
);

CREATE TABLE IF NOT EXISTS oncology_profiles (
  patient_id TEXT PRIMARY KEY REFERENCES patients(id),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS thermographies (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  campaign_id TEXT REFERENCES campaigns(id),
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS thermographies_patient ON thermographies(patient_id, created_at);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  owner_id TEXT,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS files_owner ON files(owner_id);

CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  campaign_id TEXT REFERENCES campaigns(id),
  kind TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS surveys_patient ON surveys(patient_id, created_at);
CREATE INDEX IF NOT EXISTS surveys_campaign ON surveys(campaign_id, kind);
"""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


# Columnas agregadas después de la primera versión: (tabla, columna, tipo).
MIGRATIONS = [
    ("appointments", "recorded", "TEXT"),  # quién, cuándo y dónde se agendó
    ("appointments", "log", "TEXT"),  # historial de cambios de estado con fecha, persona y sede
    ("campaigns", "recorded", "TEXT"),
]


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)
        for table, column, kind in MIGRATIONS:
            columns = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})")}
            if column not in columns:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {kind}")


@contextmanager
def transaction() -> Iterator[sqlite3.Connection]:
    """Transacción explícita: todo o nada (p. ej. termografía + estudio en el expediente)."""
    conn = connect()
    try:
        conn.execute("BEGIN IMMEDIATE")
        yield conn
        conn.execute("COMMIT")
    except BaseException:
        conn.execute("ROLLBACK")
        raise
    finally:
        conn.close()


@contextmanager
def reader() -> Iterator[sqlite3.Connection]:
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()


def next_folio(conn: sqlite3.Connection, prefix: str, width: int = 4) -> str:
    """Folio consecutivo legible (`EXP-000001`, `EST-0001`), único por tipo de documento."""
    conn.execute("INSERT INTO folios(prefix, last) VALUES (?, 1) ON CONFLICT(prefix) DO UPDATE SET last = last + 1", (prefix,))
    last = conn.execute("SELECT last FROM folios WHERE prefix = ?", (prefix,)).fetchone()["last"]
    return f"{prefix}-{last:0{width}d}"


def write_audit(conn: sqlite3.Connection, actor: dict[str, str], action: str, entity: str, entity_id: str, summary: str) -> dict[str, str]:
    event = {
        "id": new_id("ev"), "at": now_iso(), "actorId": actor["id"], "actorName": actor["name"], "actorRole": actor["role"],
        "action": action, "entity": entity, "entityId": entity_id, "summary": summary,
    }
    conn.execute(
        "INSERT INTO audit(id, at, actor_id, actor_name, actor_role, action, entity, entity_id, summary) VALUES (?,?,?,?,?,?,?,?,?)",
        (event["id"], event["at"], event["actorId"], event["actorName"], event["actorRole"], action, entity, entity_id, summary),
    )
    return event


def empty_record(patient_id: str) -> dict[str, Any]:
    return {
        "patientId": patient_id,
        "history": {"family": [], "surgeries": [], "hospitalizations": [], "nonPathological": {"smoking": "nunca", "alcohol": "no"}, "immunizations": []},
        "problems": [], "vitals": [], "medications": [], "notes": [], "studies": [], "devices": [], "consents": [], "documents": [],
    }


def insert_patient(conn: sqlite3.Connection, data: dict[str, Any]) -> dict[str, Any]:
    """Abre un expediente: asigna id y número de expediente (no cambia nunca, NOM-024) y crea el expediente vacío."""
    patient = {**data, "id": new_id("p"), "record": next_folio(conn, "EXP", 6)}
    patient.setdefault("createdAt", now_iso())
    patient.setdefault("allergies", [])
    patient.setdefault("status", "activo")
    stamp = now_iso()
    conn.execute(
        "INSERT INTO patients(id, record, curp, name, birth_date, data, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)",
        (patient["id"], patient["record"], patient.get("curp"), patient["name"], patient["birthDate"], dumps(patient), patient["createdAt"], stamp),
    )
    conn.execute("INSERT INTO records(patient_id, data, version, updated_at) VALUES (?,?,1,?)", (patient["id"], dumps(empty_record(patient["id"])), stamp))
    return patient


def save_patient(conn: sqlite3.Connection, patient: dict[str, Any]) -> None:
    conn.execute(
        "UPDATE patients SET curp = ?, name = ?, birth_date = ?, data = ?, updated_at = ? WHERE id = ?",
        (patient.get("curp"), patient["name"], patient["birthDate"], dumps(patient), now_iso(), patient["id"]),
    )


def load_record(conn: sqlite3.Connection, patient_id: str) -> tuple[dict[str, Any], int] | None:
    row = conn.execute("SELECT data, version FROM records WHERE patient_id = ?", (patient_id,)).fetchone()
    return (json.loads(row["data"]), row["version"]) if row else None


def store_record(conn: sqlite3.Connection, patient_id: str, record: dict[str, Any], expected_version: int | None) -> int | None:
    """Guarda el expediente si nadie lo modificó desde que se leyó. Devuelve la nueva versión o None si hubo conflicto."""
    record = {k: v for k, v in record.items() if k != "version"}
    if expected_version is None:
        conn.execute("UPDATE records SET data = ?, version = version + 1, updated_at = ? WHERE patient_id = ?", (dumps(record), now_iso(), patient_id))
    else:
        cursor = conn.execute(
            "UPDATE records SET data = ?, version = version + 1, updated_at = ? WHERE patient_id = ? AND version = ?",
            (dumps(record), now_iso(), patient_id, expected_version),
        )
        if cursor.rowcount == 0:
            return None
    return conn.execute("SELECT version FROM records WHERE patient_id = ?", (patient_id,)).fetchone()["version"]
