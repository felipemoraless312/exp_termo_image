"""Archivos del expediente: estudios de laboratorio (PDF), imágenes y otros documentos de cada paciente."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from .. import db
from ..schemas import AnnotationsIn, FileRef
from ..settings import ALLOWED_DOCUMENT_TYPES, FILES_DIR, MAX_UPLOAD_BYTES
from .expedientes import get_patient_or_404

router = APIRouter(tags=["archivos"])


def _ref(row: Any) -> dict[str, Any]:
    return FileRef(id=row["id"], name=row["name"], content_type=row["content_type"], size=row["size"], label=row["label"], created_at=row["created_at"]).doc()


@router.get("/pacientes/{patient_id}/archivos")
def list_patient_files(patient_id: str) -> list[dict[str, Any]]:
    """Archivos del expediente que no pertenecen a una termografía interpretada (esas se listan con la termografía)."""
    with db.reader() as conn:
        get_patient_or_404(conn, patient_id)
        rows = conn.execute("SELECT * FROM files WHERE patient_id = ? AND owner_id IS NULL ORDER BY created_at DESC, name", (patient_id,)).fetchall()
    return [_ref(r) for r in rows]


@router.post("/pacientes/{patient_id}/archivos", status_code=201)
async def upload_patient_files(patient_id: str, files: list[UploadFile] = File(...), category: str = Form(..., min_length=2, max_length=80)) -> list[dict[str, Any]]:
    """Guarda los archivos en `archivos/<paciente>/` y los registra en una sola transacción: o se guardan todos o ninguno."""
    with db.reader() as conn:
        get_patient_or_404(conn, patient_id)
    target_dir = FILES_DIR / patient_id
    target_dir.mkdir(parents=True, exist_ok=True)

    saved: list[dict[str, Any]] = []
    written: list[Path] = []
    try:
        for upload in files:
            if upload.content_type not in ALLOWED_DOCUMENT_TYPES:
                raise HTTPException(415, f"{upload.filename}: solo se aceptan PDF o imágenes JPG, PNG, TIFF, BMP o WEBP.")
            content = await upload.read(MAX_UPLOAD_BYTES + 1)
            if len(content) > MAX_UPLOAD_BYTES:
                raise HTTPException(413, f"{upload.filename}: el archivo excede {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")
            if not content:
                raise HTTPException(422, f"{upload.filename}: el archivo está vacío.")
            file_id = db.new_id("f")
            suffix = Path(upload.filename or "").suffix.lower()[:6] or (".pdf" if upload.content_type == "application/pdf" else ".jpg")
            path = target_dir / f"{file_id}{suffix}"
            path.write_bytes(content)
            written.append(path)
            saved.append({"id": file_id, "name": Path(upload.filename or file_id).name[:200], "content_type": upload.content_type, "size": len(content), "path": str(path.relative_to(FILES_DIR))})

        stamp = db.now_iso()
        with db.transaction() as conn:
            for f in saved:
                conn.execute(
                    "INSERT INTO files(id, patient_id, owner_id, name, content_type, size, path, label, created_at) VALUES (?,?,NULL,?,?,?,?,?,?)",
                    (f["id"], patient_id, f["name"], f["content_type"], f["size"], f["path"], category.strip(), stamp),
                )
    except BaseException:
        for path in written:
            path.unlink(missing_ok=True)
        raise
    return [FileRef(id=f["id"], name=f["name"], content_type=f["content_type"], size=f["size"], label=category.strip(), created_at=stamp).doc() for f in saved]


# ── Anotaciones (capa vectorial sobre una imagen; la original no se modifica) ──


@router.get("/pacientes/{patient_id}/anotaciones")
def list_annotations(patient_id: str) -> dict[str, Any]:
    """Anotaciones vigentes de las imágenes de la paciente, por id de archivo."""
    with db.reader() as conn:
        get_patient_or_404(conn, patient_id)
        rows = conn.execute("SELECT file_id, data FROM annotations WHERE patient_id = ?", (patient_id,)).fetchall()
    out = {}
    for r in rows:
        data = json.loads(r["data"])
        data.pop("history", None)
        out[r["file_id"]] = data
    return out


@router.put("/archivos/{file_id}/anotaciones")
def save_annotations(file_id: str, body: AnnotationsIn) -> dict[str, Any]:
    """Guarda la capa de anotaciones (sin marcas queda vacía). Las versiones anteriores quedan en `history` (últimas 20)."""
    with db.transaction() as conn:
        f = conn.execute("SELECT patient_id, content_type FROM files WHERE id = ?", (file_id,)).fetchone()
        if not f or not f["content_type"].startswith("image/"):
            raise HTTPException(404, "La imagen no existe.")
        row = conn.execute("SELECT data FROM annotations WHERE file_id = ?", (file_id,)).fetchone()
        previous = json.loads(row["data"]) if row else None
        history = (previous or {}).pop("history", []) if previous else []
        if previous:
            history = [*history, previous][-20:]
        data = {**body.doc(), "history": history}
        now = db.now_iso()
        if row:
            conn.execute("UPDATE annotations SET data = ?, updated_at = ? WHERE file_id = ?", (db.dumps(data), now, file_id))
        else:
            conn.execute("INSERT INTO annotations(file_id, patient_id, data, updated_at) VALUES (?,?,?,?)", (file_id, f["patient_id"], db.dumps(data), now))
    data.pop("history")
    return data
