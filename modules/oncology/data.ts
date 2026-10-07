import 'server-only'

import { requirePortalViewer, requireStaff } from '@/modules/auth/session'
import { todayISO } from '@/lib/format'
import * as repository from './repository'
import type { Campaign, CampaignAgenda, OncologyChart, Screening } from './types'
import { PSYCHO_SURVEY_KIND, type SurveyResponse } from './psycho-survey'

/* Data Access Layer de oncología: cada función verifica sesión y permiso antes de leer. */

export async function getOncologyChart(patientId: string): Promise<OncologyChart | undefined> {
  await requireStaff('oncology')
  return repository.findOncologyChart(patientId)
}

export async function listCampaigns(): Promise<Campaign[]> {
  await requireStaff('oncology')
  return repository.listCampaigns()
}

/** La campaña de hoy o la próxima; si no hay, la más reciente. */
export function pickCurrentCampaign(campaigns: Campaign[]): Campaign | undefined {
  const today = todayISO()
  const upcoming = campaigns.filter((c) => c.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  return upcoming[0] ?? campaigns[0]
}

export async function getCampaignAgenda(campaignId: string): Promise<CampaignAgenda | undefined> {
  await requireStaff('oncology')
  return repository.findCampaignAgenda(campaignId)
}

export async function listPatientSurveys(patientId: string): Promise<SurveyResponse[]> {
  await requireStaff('oncology')
  return repository.listPatientSurveys(patientId)
}

/** Encuestas de psico-oncología de una campaña (o todas), para los resultados agregados. */
export async function listPsychoSurveys(campaignId?: string): Promise<SurveyResponse[]> {
  await requireStaff('oncology')
  return repository.listSurveys(PSYCHO_SURVEY_KIND, campaignId)
}

/**
 * Lo que la paciente (o su contacto autorizado) ve de oncología en el portal: sus citas de campaña y su cuestionario.
 * La valoración de riesgo y los resultados se comunican por el médico, no se muestran aquí.
 */
/** Encuesta de psico-oncología de la paciente en el portal: si ya la contestó para su campaña vigente. */
export async function getPortalPsychoSurvey(): Promise<{ survey?: SurveyResponse; campaignName?: string }> {
  const viewer = await requirePortalViewer()
  const [chart, surveys] = await Promise.all([repository.findOncologyChart(viewer.patient.id), repository.listPatientSurveys(viewer.patient.id)])
  const appointment = chart?.appointments.find((a) => a.status !== 'cancelada' && a.status !== 'no-asistio')
  const survey = surveys.find((s) => s.kind === PSYCHO_SURVEY_KIND && s.campaignId === appointment?.campaign.id)
  return { survey, campaignName: appointment?.campaign.name }
}

export async function getPortalCampaigns(): Promise<{ appointments: (OncologyChart['appointments'][number] & { campaign: { location?: string } })[]; screening?: Screening }> {
  const viewer = await requirePortalViewer()
  const [chart, campaigns] = await Promise.all([repository.findOncologyChart(viewer.patient.id), repository.listCampaigns()])
  if (!chart) return { appointments: [] }
  const appointments = chart.appointments
    .filter((a) => a.status !== 'cancelada')
    .map((a) => ({ ...a, campaign: { ...a.campaign, location: campaigns.find((c) => c.id === a.campaign.id)?.location } }))
  return { appointments, screening: chart.profile.screening }
}
