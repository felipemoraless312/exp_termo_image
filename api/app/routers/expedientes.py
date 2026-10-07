"""Ficha de identificación, expediente clínico, folios y bitácora."""

from __future__ import annotations

import json
import sqlite3
import unicodedata
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from .. import db
from ..schemas import AuditIn, ChartSave, PatientIn

router = APIRouter(tags=["expediente"])


def _normalize(value: str) -> str:
    """Ignora mayúsculas y acentos: "maria" encuentra "María"."""
    return "".join(c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn").lower()


def _patient_row(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return json.loads(row["data"]) if row else None


def get_patient_or_404(conn: sqlite3.Connection, patient_id: str) -> dict[str, Any]:
    patient = _patient_row(conn.execute("SELECT data FROM patients WHERE id = ?", (patient_id,)).fetchone())
    if not patient:
        raise HTTPException(404, "El expediente no existe.")
    return patient


@router.get("/pacientes")
def list_patients(q: str | None = None) -> list[dict[str, Any]]:
    with db.reader() as conn:
        patients = [json.loads(r["data"]) for r in conn.execute("SELECT data FROM patients")]
    patients.sort(key=lambda p: _normalize(p["name"]))
    term = _normalize(q.strip()) if q else ""
    if not term:
        return patients
    return [p for p in patients if any(term in _normalize(str(p.get(k) or "")) for k in ("name", "record", "phone", "curp"))]


@router.get("/pacientes/por-expediente/{record}")
def patient_by_record(record: str) -> dict[str, Any]:
    with db.reader() as conn:
        patient = _patient_row(conn.execute("SELECT data FROM patients WHERE lower(record) = lower(?)", (record.strip(),)).fetchone())
    if not patient:
        raise HTTPException(404, "El expediente no existe.")
    return patient


@router.get("/pacientes/por-curp/{curp}")
def patient_by_curp(curp: str) -> dict[str, Any]:
    with db.reader() as conn:
        patient = _patient_row(conn.execute("SELECT data FROM patients WHERE upper(curp) = upper(?)", (curp.strip(),)).fetchone())
    if not patient:
        raise HTTPException(404, "No hay expediente con esa CURP.")
    return patient


@router.get("/pacientes/{patient_id}")
def get_patient(patient_id: str) -> dict[str, Any]:
    with db.reader() as conn:
        return get_patient_or_404(conn, patient_id)


@router.post("/pacientes", status_code=201)
def create_patient(body: PatientIn) -> dict[str, Any]:
    data = body.model_dump(exclude_none=True)
    data.pop("id", None)
    data.pop("record", None)
    with db.transaction() as conn:
        if body.curp and conn.execute("SELECT 1 FROM patients WHERE upper(curp) = upper(?)", (body.curp,)).fetchone():
            raise HTTPException(409, "Ya existe un expediente con esa CURP.")
        return db.insert_patient(conn, data)


@router.put("/pacientes/{patient_id}")
def update_patient(patient_id: str, body: PatientIn) -> dict[str, Any]:
    with db.transaction() as conn:
        current = get_patient_or_404(conn, patient_id)
        if body.curp:
            other = conn.execute("SELECT id FROM patients WHERE upper(curp) = upper(?) AND id <> ?", (body.curp, patient_id)).fetchone()
            if other:
                raise HTTPException(409, "Otra persona ya tiene registrada esa CURP.")
        # El id, el número de expediente y la fecha de apertura no cambian nunca.
        patient = {**body.model_dump(exclude_none=True), "id": current["id"], "record": current["record"], "createdAt": current["createdAt"]}
        db.save_patient(conn, patient)
        return patient


@router.get("/expedientes")
def list_records() -> list[dict[str, Any]]:
    with db.reader() as conn:
        return [{**json.loads(r["data"]), "version": r["version"]} for r in conn.execute("SELECT data, version FROM records")]


@router.get("/expedientes/{patient_id}")
def get_record(patient_id: str) -> dict[str, Any]:
    with db.reader() as conn:
        loaded = db.load_record(conn, patient_id)
    if not loaded:
        raise HTTPException(404, "El expediente no existe.")
    record, version = loaded
    return {**record, "version": version}


@router.put("/expedientes/{patient_id}")
def save_chart(patient_id: str, body: ChartSave) -> dict[str, Any]:
    """Guarda ficha y expediente en una sola transacción. 409 si alguien más lo modificó mientras tanto."""
    with db.transaction() as conn:
        current = get_patient_or_404(conn, patient_id)
        version = db.store_record(conn, patient_id, {**body.record, "patientId": patient_id}, body.version)
        if version is None:
            raise HTTPException(409, "El expediente cambió mientras lo editabas. Recarga la página e inténtalo de nuevo.")
        if body.patient:
            patient = PatientIn.model_validate(body.patient).model_dump(exclude_none=True)
            db.save_patient(conn, {**patient, "id": current["id"], "record": current["record"], "createdAt": current["createdAt"]})
    return {"version": version}


@router.post("/folios/{prefix}")
def next_folio(prefix: str, width: int = Query(4, ge=3, le=8)) -> dict[str, str]:
    if not prefix.isalpha() or len(prefix) > 6:
        raise HTTPException(422, "Prefijo de folio no válido.")
    with db.transaction() as conn:
        return {"folio": db.next_folio(conn, prefix.upper(), width)}


@router.post("/bitacora", status_code=201)
def add_audit(body: AuditIn) -> dict[str, str]:
    with db.transaction() as conn:
        return db.write_audit(conn, body.actor.model_dump(), body.action, body.entity, body.entityId, body.summary)


@router.get("/bitacora")
def read_audit(entityId: str | None = None, limit: int = Query(200, ge=1, le=2000)) -> list[dict[str, str]]:
    sql = "SELECT * FROM audit" + (" WHERE entity_id = ?" if entityId else "") + " ORDER BY at DESC LIMIT ?"
    params: tuple[Any, ...] = (entityId, limit) if entityId else (limit,)
    with db.reader() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [
        {"id": r["id"], "at": r["at"], "actorId": r["actor_id"], "actorName": r["actor_name"], "actorRole": r["actor_role"],
         "action": r["action"], "entity": r["entity"], "entityId": r["entity_id"], "summary": r["summary"]}
        for r in rows
    ]
