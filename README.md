# UP Chiapas · Expediente clínico electrónico

Expediente clínico electrónico (NOM-004-SSA3-2012 / NOM-024-SSA3-2012) con apartado de oncología para el tamizaje de cáncer de mama y campañas de termografía mamaria.

El sistema tiene dos partes que deben estar corriendo al mismo tiempo:

| Parte | Tecnología | Carpeta | Dirección |
|---|---|---|---|
| **Backend** (API del expediente) | Python · FastAPI · SQLite | `api/` | `http://127.0.0.1:8000` (solo accesible desde la misma PC) |
| **Frontend** (sistema del médico y portal del paciente) | Next.js 16 · React 19 | raíz del proyecto | `http://localhost:3000` |

```
Navegador ──► Next.js (puerto 3000) ──► API FastAPI (127.0.0.1:8000) ──► api/data/medora.db
                                                                    └─► api/data/archivos/ (imágenes térmicas)
```

El navegador nunca habla directamente con la API: Next.js la consulta desde el servidor enviando la clave `MEDORA_API_KEY`.

---

## 1. Requisitos

- **Node.js 22** o superior (probado con 22.23) y **npm**.
- **Python 3.12** o superior (probado con 3.14), disponible como `python` en la terminal.
- Windows (los scripts de `package.json` usan rutas de Windows: `api\.venv\Scripts\python`).

> En esta máquina `pnpm` no funciona (el `packageManager` declarado en `package.json` no se puede descargar), así que todos los comandos usan **npm**.

## 2. Instalación (solo la primera vez)

Desde la raíz del proyecto:

```bash
# Frontend: dependencias de Node (si la carpeta node_modules ya existe, se puede omitir)
npm install

# Backend: crea el entorno virtual api/.venv e instala FastAPI, uvicorn, openpyxl…
npm run api:setup
```

### Variables de entorno

Ambos servidores leen el archivo **`.env.local`** de la raíz:

```env
# API del expediente (FastAPI). Solo para el servidor; no usar el prefijo NEXT_PUBLIC_.
MEDORA_API_URL=http://127.0.0.1:8000
MEDORA_API_KEY=<clave secreta larga>
```

Si el archivo no existe, créalo y genera una clave con:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

La clave debe ser la misma para los dos servidores (los dos leen este mismo archivo). No la compartas ni la subas al repositorio.

## 3. Correr el sistema (desarrollo)

Se necesitan **dos terminales**, ambas en la raíz del proyecto.

**Terminal 1 · Backend**

```bash
npm run api
```

Debe mostrar `Uvicorn running on http://127.0.0.1:8000`. La base de datos se crea sola la primera vez en `api/data/medora.db`.

**Terminal 2 · Frontend**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000): es el único inicio de sesión, con pestañas para **Paciente** (o contacto autorizado) y **Personal médico**. Los accesos de prueba están en `accesos-portal-pruebas.txt`.

> **Orden:** conviene arrancar primero el backend. Si el frontend no encuentra la API, las páginas del sistema mostrarán el aviso *“No hay conexión con la API del expediente”*; basta con iniciar `npm run api` y recargar.

### Desde un celular o tablet en la misma red

`npm run dev` escucha en todas las interfaces (`0.0.0.0:3000`). Averigua la IP de la PC con `ipconfig` (p. ej. `192.168.1.50`) y abre `http://192.168.1.50:3000/sistema` desde el otro dispositivo. Si no carga, permite Node.js en el Firewall de Windows para redes privadas.

La API **no** queda expuesta a la red: solo escucha en `127.0.0.1`, y los dispositivos acceden a todo a través de Next.js.

## 4. Correr en modo producción

Más rápido y estable que el modo desarrollo; recomendado para el día de la campaña.

```bash
npm run build     # compila el frontend (una vez por cada cambio de código)
npm run api       # terminal 1
npm run start     # terminal 2 · http://localhost:3000
```

## 5. Importar el preregistro de una campaña

El archivo `aspirantes.xlsx` (respuestas del formulario de Google) se importa con:

```bash
npm run importar -- --fecha 2026-10-07
```

- Si no se indica `--fecha`, usa el día de mañana. También acepta otro archivo: `npm run importar -- ..\otro-archivo.xlsx --fecha AAAA-MM-DD`.
- Por cada aspirante abre el expediente (o reutiliza el existente si coinciden el nombre y la fecha de nacimiento), guarda su cuestionario de tamizaje y la agenda en la campaña con su horario.
- **Se puede ejecutar varias veces sin duplicar** pacientes ni citas. Si alguien se registró dos veces, vale su último registro.
- Al terminar muestra una lista **“Para revisar”** (registros duplicados, apellidos faltantes, edades que no coinciden, etc.).

No es necesario detener los servidores para importar.

## 6. Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Lista de pacientes | `/sistema/pacientes` |
| Expediente de un paciente | `/sistema/pacientes/<id>` (pestañas: Resumen, **Oncología**, Historia clínica, Notas, Signos, Estudios…) |
| Agenda de la campaña de mama | `/sistema/campana` (llegada, termografía, avisos, lista para imprimir) |
| Encuesta de psico-oncología | Botón **Encuesta** en la pestaña Oncología o en la agenda → `/sistema/pacientes/<id>/encuesta` |
| Resultados agregados de la encuesta | `/sistema/campana/encuesta` (por campaña o todas) |
| Preguntas de la encuesta | `modules/oncology/psycho-survey.ts` (versión 3: solo las preguntas de `nueva_encuesta_2.xlsx`, en su orden) |
| Documentación interactiva de la API | `http://127.0.0.1:8000/docs` (las peticiones requieren la cabecera `X-API-Key`) |
| Base de datos | `api/data/medora.db` |
| Imágenes térmicas | `api/data/archivos/<id del paciente>/` |
| Código del backend | `api/app/` (`main.py`, `routers/`, `oncology_rules.py`, `importar.py`) |
| Pacientes de demostración anteriores | `respaldo-datos-demo.ts.txt` |

## 7. Respaldos

Toda la información clínica está en **`api/data/`**. Para respaldar, detén la API (`Ctrl + C` en la terminal 1) y copia la carpeta completa a un lugar seguro (disco externo o unidad cifrada):

```bash
xcopy api\data D:\respaldos\medora-2026-10-07 /E /I
```

Contiene datos personales y de salud: no la subas al repositorio (ya está en `.gitignore`) ni la compartas por medios no seguros.

## 8. Problemas frecuentes

| Síntoma | Solución |
|---|---|
| *“No hay conexión con la API del expediente”* | La API no está corriendo: ejecuta `npm run api`. |
| *“Clave de API no válida”* o *“Falta MEDORA_API_KEY”* | Revisa `.env.local` y reinicia **ambos** servidores. |
| `"api" no se reconoce como un comando interno` | Falta crear el entorno de Python: `npm run api:setup`. |
| `[Errno 10048]` / puerto 8000 ocupado | Ya hay otra API corriendo; ciérrala o usa esa. |
| *“El expediente cambió mientras lo editabas”* | Otra persona guardó el mismo expediente al mismo tiempo; recarga la página y repite el cambio. |
| Las imágenes no suben | Cada imagen debe ser JPG, PNG, TIFF, BMP o WEBP de hasta 20 MB. |
| `pnpm` muestra `CommandNotFound` | Usa los comandos con `npm`. |

## 9. Seguridad antes de usarlo con más personas

- Las cuentas del personal (`modules/staff/data.ts`) son de demostración: **médico** y **enfermería** (signos vitales, llegada a la agenda y notas de enfermería). **Cambia las contraseñas** y crea una cuenta por persona para que la bitácora registre quién hizo cada cosa.
- Los contactos autorizados del portal aún se guardan en memoria y se pierden al reiniciar el frontend.
