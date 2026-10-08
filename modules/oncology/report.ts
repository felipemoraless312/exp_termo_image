import 'server-only'

import { REPORT_MAX_IMAGES } from '@/config/report'
import { requireStaff } from '@/modules/auth/session'
import * as files from '@/modules/files/repository'
import { THERMAL_CATEGORY, type PatientFile } from '@/modules/files/types'
import * as patients from '@/modules/patients/repository'
import type { Patient } from '@/modules/patients/types'
import { findStaffByName } from '@/modules/staff/data'
import * as repository from './repository'
import type { Thermography, ThermographyReport } from './types'

export type ReportImage = Pick<PatientFile, 'id' | 'name'>

export interface ThermographyReportView {
  patient: Patient
  thermography: Thermography
  /** Imágenes que se pueden elegir: las de la termografía y las imágenes térmicas del expediente. */
  candidates: ReportImage[]
  /** Lo que se imprime (configuración guardada o valores automáticos). */
  report: ThermographyReport
  saved: boolean
  doctor: { name: string; specialty?: string }
}

/** Datos del informe impreso de una termografía. Sin configuración guardada, se arma automáticamente. */
export async function getThermographyReport(patientId: string, thermographyId: string): Promise<ThermographyReportView | undefined> {
  await requireStaff('oncology')
  const [patient, chart, patientFiles] = await Promise.all([
    patients.findPatientById(patientId), repository.findOncologyChart(patientId), files.listPatientFiles(patientId),
  ])
  const thermography = chart?.thermographies.find((t) => t.id === thermographyId)
  if (!patient || !chart || !thermography) return undefined

  const byName = (a: ReportImage, b: ReportImage) => a.name.localeCompare(b.name, 'es', { numeric: true })
  const own = thermography.images.filter((f) => f.contentType.startsWith('image/')).sort(byName)
  const thermal = patientFiles.filter((f) => f.label === THERMAL_CATEGORY && f.contentType.startsWith('image/')).sort(byName)
  const candidates = [...own, ...thermal].map(({ id, name }) => ({ id, name }))
  const known = new Set(candidates.map((c) => c.id))

  // Fecha del estudio: la de su campaña; si no se indicó, la campaña más reciente de la paciente hasta el registro.
  const performed = thermography.performedAt.slice(0, 10)
  const campaignDate = chart.appointments.find((a) => a.campaign.id === thermography.campaignId)?.campaign.date
    ?? chart.appointments.map((a) => a.campaign.date).filter((d) => d <= performed).sort().at(-1)
  const saved = thermography.report
  const report: ThermographyReport = {
    imageIds: saved ? saved.imageIds.filter((id) => known.has(id)) : candidates.slice(0, REPORT_MAX_IMAGES).map((c) => c.id),
    diagnosis: saved?.diagnosis ?? thermography.findings,
    studyDate: saved?.studyDate ?? campaignDate ?? performed,
    recorded: saved?.recorded,
  }
  const staff = await findStaffByName(thermography.performedBy)
  return { patient, thermography, candidates, report, saved: Boolean(saved), doctor: { name: staff?.name ?? thermography.performedBy, specialty: staff?.specialty } }
}

/** "Mastopatía fibroquística bilateral" + TH3 → "Mastopatía fibroquística bilateral. TH3." (sin repetir la clasificación). */
export function diagnosisLine(diagnosis: string, grade: string) {
  const text = diagnosis.trim().replace(/\.+$/, '')
  return new RegExp(`\\b${grade}\\b`).test(text) ? `${text}.` : `${text}. ${grade}.`
}
