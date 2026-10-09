import type { Annotation, Shape } from '../annotations'

/** Una marca en SVG. `hit`: versión invisible y más gruesa para poder seleccionarla con el puntero. */
export function ShapeSvg({ shape, hit = false, selected = false }: { shape: Shape; hit?: boolean; selected?: boolean }) {
  const { type, color, width, points, fill } = shape
  const stroke = hit ? 'transparent' : selected ? '#ffffff' : color
  const strokeWidth = hit ? Math.max(width * 4, 12) : selected ? width * 0.6 : width
  const dash = selected ? `${width * 2} ${width * 1.5}` : undefined
  const common = {
    stroke, strokeWidth, strokeDasharray: dash, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    'data-id': hit ? shape.id : undefined, pointerEvents: hit ? ('all' as const) : ('none' as const),
  }
  const areaFill = hit ? 'transparent' : fill && !selected ? color : 'none'
  const fillOpacity = fill && !selected ? 0.25 : undefined
  const [a, b = a] = points

  switch (type) {
    case 'flecha': {
      const angle = Math.atan2(b[1] - a[1], b[0] - a[0])
      const head = width * 5
      const left: [number, number] = [b[0] - head * Math.cos(angle - Math.PI / 7), b[1] - head * Math.sin(angle - Math.PI / 7)]
      const right: [number, number] = [b[0] - head * Math.cos(angle + Math.PI / 7), b[1] - head * Math.sin(angle + Math.PI / 7)]
      return (
        <g>
          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} {...common} />
          <polygon points={`${b[0]},${b[1]} ${left[0]},${left[1]} ${right[0]},${right[1]}`} {...common} fill={hit ? 'transparent' : selected ? 'none' : color} />
        </g>
      )
    }
    case 'elipse':
      return <ellipse cx={(a[0] + b[0]) / 2} cy={(a[1] + b[1]) / 2} rx={Math.abs(b[0] - a[0]) / 2} ry={Math.abs(b[1] - a[1]) / 2} {...common} fill={areaFill} fillOpacity={fillOpacity} />
    case 'rectangulo':
      return <rect x={Math.min(a[0], b[0])} y={Math.min(a[1], b[1])} width={Math.abs(b[0] - a[0])} height={Math.abs(b[1] - a[1])} {...common} fill={areaFill} fillOpacity={fillOpacity} />
    case 'poligono':
      return <polygon points={points.map((p) => p.join(',')).join(' ')} {...common} fill={areaFill} fillOpacity={fillOpacity} />
    case 'trazo':
      return <polyline points={points.map((p) => p.join(',')).join(' ')} {...common} fill="none" />
    case 'texto': {
      const size = width * 7
      return (
        <text x={a[0]} y={a[1]} fontSize={size} fontWeight={700} fontFamily="Arial, sans-serif" dominantBaseline="middle"
          fill={hit ? 'transparent' : color} stroke={hit ? 'transparent' : color === '#000000' ? '#ffffff' : '#000000'} strokeWidth={hit ? size : size / 8}
          paintOrder="stroke" data-id={hit ? shape.id : undefined} pointerEvents={hit ? 'all' : 'none'} textDecoration={selected ? 'underline' : undefined}>
          {shape.text}
        </text>
      )
    }
  }
}

/**
 * Capa de anotaciones encima de una imagen. Ocupa la misma caja que la imagen:
 * `fit="cover"` para imágenes con object-cover (miniaturas, informe), `contain` para la imagen completa.
 */
export function AnnotationLayer({ annotation, fit = 'cover' }: { annotation?: Annotation; fit?: 'cover' | 'contain' }) {
  if (!annotation?.shapes.length) return null
  return (
    <svg viewBox={`0 0 ${annotation.imageWidth} ${annotation.imageHeight}`} preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
      className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      {annotation.shapes.map((s) => <ShapeSvg key={s.id} shape={s} />)}
    </svg>
  )
}
