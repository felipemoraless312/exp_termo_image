import type { Stamp } from '@/modules/patients/stamp'

/* Anotaciones sobre una imagen: capa vectorial en píxeles de la imagen original (la imagen nunca se modifica). */

export type ShapeType = 'flecha' | 'elipse' | 'rectangulo' | 'poligono' | 'trazo' | 'texto'
export type Point = [number, number]

export interface Shape {
  id: string
  type: ShapeType
  color: string
  /** Grosor del trazo, en píxeles de la imagen original. */
  width: number
  /** flecha/elipse/rectángulo: [inicio, fin] · polígono/trazo: vértices · texto: [posición]. */
  points: Point[]
  text?: string
  /** Relleno semitransparente (segmentación) en elipse, rectángulo y polígono. */
  fill?: boolean
}

export interface Annotation { imageWidth: number; imageHeight: number; shapes: Shape[]; recorded?: Stamp }

export type AnnotationMap = Record<string, Annotation | undefined>

/** Colores que contrastan con la paleta térmica (amarillos, naranjas y morados). */
export const ANNOTATION_COLORS = ['#00e5ff', '#39ff14', '#ffffff', '#ff2d95', '#000000'] as const

export const hasMarks = (a?: Annotation) => Boolean(a?.shapes.length)
