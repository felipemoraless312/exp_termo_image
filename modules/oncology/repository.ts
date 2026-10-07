import 'server-only'

import { api, apiMaybe } from '@/lib/server/api'
import type {
  Appointment, AppointmentStatus, BreastExam, Campaign, CampaignAgenda, FileRef, OncologyChart, OncologyProfile, RiskFactors, Screening, Thermography,
} from './types'
import type { SurveyResponse } from './psycho-survey'
import type { Stamp } from '@/modules/patients/stamp'

/* Acceso crudo a la API de oncología, sin autorización. Solo `data.ts` y `actions.ts` deben importar este archivo. */

const segment = encodeURIComponent

export async function findOncologyChart(patientId: string): Promise<OncologyChart | undefined> {
  return apiMaybe<OncologyChart>(`/pacientes/${segment(patientId)}/oncologia`)
}

export async function saveScreening(patientId: string, screening: Screening): Promise<OncologyProfile> {
  return api(`/pacientes/${segment(patientId)}/oncologia/tamizaje`, { method: 'PUT', body: screening })
}

export async function saveRiskFactors(patientId: string, risk: RiskFactors): Promise<OncologyProfile> {
  return api(`/pacientes/${segment(patientId)}/oncologia/factores`, { method: 'PUT', body: risk })
}

export async function insertBreastExam(patientId: string, exam: Omit<BreastExam, 'id' | 'at'>): Promise<BreastExam> {
  return api(`/pacientes/${segment(patientId)}/oncologia/exploraciones`, { method: 'POST', body: exam })
}

export type ThermographyInput = Omit<Thermography, 'id' | 'folio' | 'patientId' | 'performedAt' | 'deltaT' | 'asymmetry' | 'grade' | 'recommendation' | 'studyId' | 'images'> & {
  recommendation?: Thermography['recommendation']
}

export async function insertThermography(patientId: string, input: ThermographyInput): Promise<Thermography> {
  return api(`/pacientes/${segment(patientId)}/oncologia/termografias`, { method: 'POST', body: input })
}

export async function uploadThermographyImages(thermographyId: string, files: File[], label: string | undefined, recorded: Stamp): Promise<FileRef[]> {
  const form = new FormData()
  for (const file of files) form.append('files', file, file.name)
  if (label) form.set('label', label)
  form.set('recorded_by', recorded.by)
  form.set('location', recorded.location)
  return api(`/termografias/${segment(thermographyId)}/imagenes`, { method: 'POST', form })
}

export async function listCampaigns(): Promise<Campaign[]> {
  return api('/campanas')
}

export async function insertCampaign(campaign: Pick<Campaign, 'name' | 'date' | 'location' | 'notes' | 'recorded'>): Promise<Campaign> {
  return api('/campanas', { method: 'POST', body: { ...campaign, kind: 'termografia-mamaria' } })
}

export async function findCampaignAgenda(campaignId: string): Promise<CampaignAgenda | undefined> {
  return apiMaybe(`/campanas/${segment(campaignId)}`)
}

export async function insertAppointment(campaignId: string, appointment: Pick<Appointment, 'patientId' | 'time' | 'visit' | 'origin' | 'notes' | 'recorded'>): Promise<Appointment> {
  return api(`/campanas/${segment(campaignId)}/citas`, { method: 'POST', body: appointment })
}

export async function updateAppointment(appointmentId: string, changes: { status?: AppointmentStatus; time?: string; notes?: string; recorded?: Stamp }): Promise<Appointment> {
  return api(`/citas/${segment(appointmentId)}`, { method: 'PATCH', body: changes })
}

export async function insertSurvey(patientId: string, survey: Omit<SurveyResponse, 'id' | 'patientId' | 'createdAt'>): Promise<SurveyResponse> {
  return api(`/pacientes/${segment(patientId)}/encuestas`, { method: 'POST', body: survey })
}

export async function updateSurvey(patientId: string, surveyId: string, changes: { answers: Record<string, string>; campaignId?: string; visit?: string; edited: Stamp }): Promise<SurveyResponse> {
  return api(`/pacientes/${segment(patientId)}/encuestas/${segment(surveyId)}`, { method: 'PUT', body: changes })
}

export async function listPatientSurveys(patientId: string): Promise<SurveyResponse[]> {
  return api(`/pacientes/${segment(patientId)}/encuestas`)
}

export async function listSurveys(kind: string, campaignId?: string): Promise<SurveyResponse[]> {
  return api(`/encuestas?kind=${segment(kind)}${campaignId ? `&campaignId=${segment(campaignId)}` : ''}`)
}
