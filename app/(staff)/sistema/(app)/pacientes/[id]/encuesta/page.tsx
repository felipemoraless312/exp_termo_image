import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { ageFrom } from '@/lib/format'
import { requireStaff } from '@/modules/auth/session'
import { getOncologyChart, listCampaigns } from '@/modules/oncology/data'
import { PsychoSurveyForm } from '@/modules/oncology/components/psycho-survey-form'
import { getPatient } from '@/modules/patients/data'

export const metadata = { title: 'Encuesta de psico-oncología' }

export default async function NewPsychoSurveyPage({ params }: PageProps<'/sistema/pacientes/[id]/encuesta'>) {
  const [{ id }] = await Promise.all([params, requireStaff('oncology.write')])
  const [patient, chart, campaigns] = await Promise.all([getPatient(id), getOncologyChart(id), listCampaigns()])
  if (!patient || !chart) notFound()
  const appointment = chart.appointments.find((a) => a.status !== 'cancelada' && a.status !== 'no-asistio')

  return (
    <>
      <Link href={`/sistema/pacientes/${patient.id}?seccion=oncologia`} className="-ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> {patient.name}
      </Link>
      <PageHeader
        eyebrow={`${patient.record} · ${ageFrom(patient.birthDate)} años`}
        title="Encuesta de psico-oncología"
        description="Conocimiento sobre la prevención del cáncer de mama y de cérvix. Si no sabe la respuesta, no se preocupe: marque “No sabe”."
      />
      <PsychoSurveyForm patientId={patient.id} campaigns={campaigns} campaignId={appointment?.campaign.id} visit={appointment?.visit} />
    </>
  )
}
