'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Circle, Eraser, MousePointer2, PaintBucket, Pencil, Pentagon, Redo2, Save, Square, Trash2, Type, Undo2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { saveImageAnnotations } from '../actions'
import { ANNOTATION_COLORS, type AnnotationMap, type Point, type Shape, type ShapeType } from '../annotations'
import { AnnotationLayer, ShapeSvg } from './annotation-layer'

type Tool = 'seleccionar' | ShapeType
type Image = { id: string; name: string }

const tools: { tool: Tool; label: string; icon: typeof Circle; hint: string }[] = [
  { tool: 'seleccionar', label: 'Seleccionar', icon: MousePointer2, hint: 'Clic en una marca para seleccionarla; arrástrela para moverla; Supr para borrarla.' },
  { tool: 'flecha', label: 'Flecha', icon: ArrowUpRight, hint: 'Arrastre desde el inicio hasta la punta de la flecha.' },
  { tool: 'elipse', label: 'Círculo', icon: Circle, hint: 'Arrastre para trazar un círculo o elipse alrededor de la zona.' },
  { tool: 'rectangulo', label: 'Rectángulo', icon: Square, hint: 'Arrastre para enmarcar una región.' },
  { tool: 'poligono', label: 'Segmentar', icon: Pentagon, hint: 'Clic en cada punto del contorno; para cerrar, clic en el primer punto o doble clic. Esc cancela.' },
  { tool: 'trazo', label: 'Trazo libre', icon: Pencil, hint: 'Dibuje a mano alzada.' },
  { tool: 'texto', label: 'Texto', icon: Type, hint: 'Clic donde va la etiqueta y escriba el texto.' },
]
const widths = [{ label: 'Fino', factor: 0.6 }, { label: 'Medio', factor: 1 }, { label: 'Grueso', factor: 1.8 }]
const newId = () => Math.random().toString(36).slice(2, 10)

/** Editor de anotaciones sobre imágenes térmicas. Dibuja una capa vectorial; la imagen original no se toca. */
export function AnnotationEditor({ patientId, images, annotations, initialFileId, canEdit }: {
  patientId: string; images: Image[]; annotations: AnnotationMap; initialFileId?: string; canEdit: boolean
}) {
  const router = useRouter()
  const [fileId, setFileId] = useState(images.some((i) => i.id === initialFileId) ? initialFileId! : images[0]?.id)
  const [saved, setSaved] = useState<AnnotationMap>(annotations)
  const [shapes, setShapes] = useState<Shape[]>(saved[fileId ?? '']?.shapes ?? [])
  const [past, setPast] = useState<Shape[][]>([])
  const [future, setFuture] = useState<Shape[][]>([])
  const [size, setSize] = useState<{ w: number; h: number } | undefined>(() => {
    const a = saved[fileId ?? '']
    return a ? { w: a.imageWidth, h: a.imageHeight } : undefined
  })
  const [tool, setTool] = useState<Tool>(canEdit ? 'elipse' : 'seleccionar')
  const [color, setColor] = useState<string>(ANNOTATION_COLORS[0])
  const [widthFactor, setWidthFactor] = useState(1)
  const [fill, setFill] = useState(false)
  const [selected, setSelected] = useState<string>()
  const [draft, setDraft] = useState<Shape>()
  const [polygon, setPolygon] = useState<Point[]>([])
  const [cursor, setCursor] = useState<Point>()
  const [message, setMessage] = useState<{ ok: boolean; text: string }>()
  const [pending, startTransition] = useTransition()
  const svgRef = useRef<SVGSVGElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ id: string; start: Point; original: Point[] } | undefined>(undefined)

  const dirty = past.length > 0 || JSON.stringify(shapes) !== JSON.stringify(saved[fileId ?? '']?.shapes ?? [])
  const base = size ? Math.max(size.w, size.h) / 250 : 2
  const strokeWidth = Math.round(base * widthFactor * 10) / 10
  const current = images.find((i) => i.id === fileId)

  const commit = useCallback((next: Shape[]) => {
    setPast((p) => [...p, shapes])
    setFuture([])
    setShapes(next)
  }, [shapes])

  const undo = useCallback(() => {
    if (!past.length) return
    setFuture((f) => [shapes, ...f])
    setShapes(past[past.length - 1])
    setPast((p) => p.slice(0, -1))
    setSelected(undefined)
  }, [past, shapes])

  const redo = useCallback(() => {
    if (!future.length) return
    setPast((p) => [...p, shapes])
    setShapes(future[0])
    setFuture((f) => f.slice(1))
  }, [future, shapes])

  const removeSelected = useCallback(() => {
    if (!selected) return
    commit(shapes.filter((s) => s.id !== selected))
    setSelected(undefined)
  }, [commit, selected, shapes])

  const closePolygon = useCallback((points: Point[]) => {
    if (points.length >= 3) commit([...shapes, { id: newId(), type: 'poligono', color, width: strokeWidth, points, fill: true }])
    setPolygon([])
  }, [color, commit, shapes, strokeWidth])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return
      if (e.key === 'Escape') { setPolygon([]); setDraft(undefined); setSelected(undefined) }
      if (!canEdit) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); removeSelected() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canEdit, redo, removeSelected, selected, undo])

  // La imagen puede terminar de cargar antes de que React conecte onLoad (viene en el HTML del servidor).
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth) setSize({ w: img.naturalWidth, h: img.naturalHeight })
  }, [fileId])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function choose(id: string) {
    if (id === fileId) return
    if (dirty && !window.confirm('Hay anotaciones sin guardar en esta imagen. ¿Descartarlas?')) return
    const a = saved[id]
    setFileId(id)
    setShapes(a?.shapes ?? [])
    setSize(a ? { w: a.imageWidth, h: a.imageHeight } : undefined)
    setPast([]); setFuture([]); setSelected(undefined); setDraft(undefined); setPolygon([]); setMessage(undefined)
    window.history.replaceState(null, '', `?f=${id}`)
  }

  function toImage(e: React.PointerEvent | React.MouseEvent): Point {
    const r = svgRef.current!.getBoundingClientRect()
    return [Math.round(((e.clientX - r.left) / r.width) * size!.w * 10) / 10, Math.round(((e.clientY - r.top) / r.height) * size!.h * 10) / 10]
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!canEdit || !size || e.button !== 0) return
    const p = toImage(e)
    if (tool === 'seleccionar') {
      const id = (e.target as Element).getAttribute('data-id') ?? (e.target as Element).closest('[data-id]')?.getAttribute('data-id') ?? undefined
      setSelected(id)
      const shape = shapes.find((s) => s.id === id)
      if (shape) {
        drag.current = { id: shape.id, start: p, original: shape.points }
        svgRef.current!.setPointerCapture(e.pointerId)
      }
      return
    }
    setSelected(undefined)
    if (tool === 'poligono') {
      const near = polygon.length >= 3 && Math.hypot(polygon[0][0] - p[0], polygon[0][1] - p[1]) < base * 6
      if (near) closePolygon(polygon)
      else setPolygon((pts) => [...pts, p])
      return
    }
    if (tool === 'texto') {
      const text = window.prompt('Texto de la etiqueta:')?.trim().slice(0, 120)
      if (text) commit([...shapes, { id: newId(), type: 'texto', color, width: strokeWidth, points: [p], text }])
      return
    }
    setDraft({ id: newId(), type: tool, color, width: strokeWidth, points: tool === 'trazo' ? [p] : [p, p], fill: (tool === 'elipse' || tool === 'rectangulo') && fill })
    svgRef.current!.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!size) return
    const p = toImage(e)
    if (tool === 'poligono') setCursor(p)
    if (drag.current) {
      const { id, start, original } = drag.current
      const dx = p[0] - start[0], dy = p[1] - start[1]
      setShapes((list) => list.map((s) => (s.id === id ? { ...s, points: original.map(([x, y]) => [x + dx, y + dy] as Point) } : s)))
      return
    }
    if (!draft) return
    if (draft.type === 'trazo') {
      const last = draft.points[draft.points.length - 1]
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) > base * 0.8) setDraft({ ...draft, points: [...draft.points, p] })
    } else setDraft({ ...draft, points: [draft.points[0], p] })
  }

  function onPointerUp() {
    if (drag.current) {
      const { id, original } = drag.current
      drag.current = undefined
      const moved = shapes.find((s) => s.id === id)
      if (moved && moved.points !== original) {
        setPast((p) => [...p, shapes.map((s) => (s.id === id ? { ...s, points: original } : s))])
        setFuture([])
      }
      return
    }
    if (!draft) return
    const [a, b = a] = draft.points
    const big = draft.type === 'trazo' ? draft.points.length > 2 : Math.hypot(b[0] - a[0], b[1] - a[1]) > base * 3
    if (big) commit([...shapes, draft])
    setDraft(undefined)
  }

  function save() {
    if (!fileId || !size) return
    startTransition(async () => {
      const result = await saveImageAnnotations({ patientId, fileId, imageWidth: size.w, imageHeight: size.h, shapes })
      if (result?.ok) {
        setSaved((m) => ({ ...m, [fileId]: { imageWidth: size.w, imageHeight: size.h, shapes } }))
        setPast([]); setFuture([])
        setMessage({ ok: true, text: result.message ?? 'Guardado' })
        router.refresh()
      } else setMessage({ ok: false, text: result?.error ?? 'No se pudo guardar.' })
    })
  }

  if (!current) return <p className="text-[14px] text-muted-foreground">La paciente no tiene imágenes térmicas.</p>

  const hint = tools.find((t) => t.tool === tool)?.hint
  return (
    <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:max-h-[78vh] lg:flex-col lg:overflow-y-auto lg:pb-0" aria-label="Imágenes">
        {images.map((img) => (
          <li key={img.id} className="shrink-0">
            <button type="button" onClick={() => choose(img.id)} aria-current={img.id === fileId}
              className={cn('block w-28 overflow-hidden rounded-lg border-2 text-left lg:w-full', img.id === fileId ? 'border-primary' : 'border-transparent hover:border-border')}>
              <span className="relative block aspect-[4/3] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- archivo protegido por sesión */}
                <img src={`/sistema/archivos/${img.id}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                <AnnotationLayer annotation={saved[img.id]} />
              </span>
              <span className="flex items-center justify-between gap-1 px-1.5 py-1 text-[11px] text-muted-foreground">
                <span className="truncate">{img.name}</span>
                {Boolean(saved[img.id]?.shapes.length) && <span className="shrink-0 rounded bg-primary px-1 text-[10px] font-medium text-primary-foreground">Anotada</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="min-w-0 space-y-3">
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2" role="toolbar" aria-label="Herramientas">
            {tools.map(({ tool: t, label, icon: Icon }) => (
              <button key={t} type="button" title={label} aria-label={label} aria-pressed={tool === t} onClick={() => { setTool(t); setPolygon([]); if (t !== 'seleccionar') setSelected(undefined) }}
                className={cn('flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px]', tool === t ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>
                <Icon size={16} aria-hidden="true" /><span className="hidden xl:inline">{label}</span>
              </button>
            ))}
            <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
            {ANNOTATION_COLORS.map((c) => (
              <button key={c} type="button" title={`Color ${c}`} aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => setColor(c)}
                className={cn('size-7 rounded-full border-2', color === c ? 'border-primary ring-2 ring-primary/40' : 'border-border')} style={{ background: c }} />
            ))}
            <select value={widthFactor} onChange={(e) => setWidthFactor(Number(e.target.value))} aria-label="Grosor" className="h-9 rounded-lg border border-input bg-card px-2 text-[13px]">
              {widths.map((w) => <option key={w.label} value={w.factor}>{w.label}</option>)}
            </select>
            <button type="button" title="Relleno semitransparente (círculo y rectángulo)" aria-pressed={fill} onClick={() => setFill((f) => !f)}
              className={cn('flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px]', fill ? 'bg-accent text-accent-foreground' : 'hover:bg-muted')}>
              <PaintBucket size={16} aria-hidden="true" /> Relleno
            </button>
            <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
            <button type="button" title="Deshacer (Ctrl+Z)" aria-label="Deshacer" onClick={undo} disabled={!past.length} className="flex size-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40"><Undo2 size={16} /></button>
            <button type="button" title="Rehacer (Ctrl+Y)" aria-label="Rehacer" onClick={redo} disabled={!future.length} className="flex size-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40"><Redo2 size={16} /></button>
            <button type="button" title="Borrar la marca seleccionada (Supr)" aria-label="Borrar selección" onClick={removeSelected} disabled={!selected} className="flex size-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40"><Trash2 size={16} /></button>
            <button type="button" title="Quitar todas las marcas" aria-label="Quitar todas las marcas" disabled={!shapes.length}
              onClick={() => { if (window.confirm('¿Quitar todas las marcas de esta imagen?')) { commit([]); setSelected(undefined) } }}
              className="flex size-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40"><Eraser size={16} /></button>
            <button type="button" onClick={save} disabled={pending || !dirty || !size}
              className="ml-auto flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-medium text-primary-foreground disabled:opacity-40">
              <Save size={15} aria-hidden="true" /> {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        )}
        <p className="text-[13px] text-muted-foreground">
          {current.name}
          {canEdit ? ` · ${hint}` : ' · Solo lectura'}
          {dirty && <strong className="ml-2 text-warning">Cambios sin guardar</strong>}
          {message && <span role="status" className={cn('ml-2 font-medium', message.ok ? 'text-success' : 'text-danger')}>{message.text}</span>}
        </p>

        <div className="relative mx-auto select-none overflow-hidden rounded-xl bg-black"
          style={{ aspectRatio: size ? `${size.w} / ${size.h}` : '4 / 3', width: size ? `min(100%, calc(78vh * ${size.w / size.h}))` : '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- archivo protegido por sesión; se necesita el tamaño original */}
          <img ref={imgRef} key={current.id} src={`/sistema/archivos/${current.id}`} alt={current.name} draggable={false} className="absolute inset-0 h-full w-full object-contain"
            onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
          {size && (
            <svg ref={svgRef} viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="xMidYMid meet"
              className={cn('absolute inset-0 h-full w-full touch-none', canEdit && (tool === 'seleccionar' ? 'cursor-default' : 'cursor-crosshair'))}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
              onDoubleClick={() => tool === 'poligono' && closePolygon(polygon)} onPointerLeave={() => setCursor(undefined)}>
              {shapes.map((s) => <ShapeSvg key={s.id} shape={s} />)}
              {selected && shapes.filter((s) => s.id === selected).map((s) => <ShapeSvg key={`sel-${s.id}`} shape={s} selected />)}
              {draft && <ShapeSvg shape={draft} />}
              {polygon.length > 0 && (
                <g pointerEvents="none">
                  <polyline points={[...polygon, ...(cursor ? [cursor] : [])].map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={`${strokeWidth * 2} ${strokeWidth}`} />
                  {polygon.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={strokeWidth * (i === 0 ? 2.2 : 1.3)} fill={i === 0 ? '#ffffff' : color} stroke="#000000" strokeWidth={strokeWidth / 3} />)}
                </g>
              )}
              {canEdit && tool === 'seleccionar' && shapes.map((s) => <ShapeSvg key={`hit-${s.id}`} shape={s} hit />)}
            </svg>
          )}
        </div>
        <p className="text-[12px] text-subtle">La imagen original no se modifica: las marcas se guardan como una capa encima y se pueden corregir o quitar en cualquier momento. Aparecen en las miniaturas y en el informe impreso.</p>
      </div>
    </div>
  )
}
