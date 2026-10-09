import Link from 'next/link'
import { ClipboardList, FileText, Info, PenLine, ScanHeart } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { DescriptionItem, DescriptionList, List, ListItem } from '@/components/ui/list'
import { SectionTitle } from '@/components/ui/page-header'
import { formatDate, formatDateTime, formatTime } from '@/lib/format'
import type { ClinicalRecord, Patient } from '@/modules/patients/types'
import { formatStamp } from '@/modules/patients/stamp'
import {
  answerLabels, appointmentOriginLabels, appointmentStatusInfo, formatLogEntry, recommendationInfo, riskLevelInfo, thermalGradeInfo, vascularPatternLabels, visitLabels,
  type BreastExam, type BreastSide, type Campaign, type OncologyChart, type ThermalSide, type Thermography,
} from '../types'
import {
  AppointmentActions, BreastExamDialog, OncologyDatalists, RiskFactorsDialog, ScheduleDialog, ScreeningDialog, ThermographyDialog, ThermographyImagesDialog,
} from './oncology-forms'
import { answeredCount, psychoSurveyQuestions, type SurveyResponse } from '../psycho-survey'
import { ImageGrid, UploadFilesDialog } from '@/modules/files/components/patient-files'
import { THERMAL_CATEGORY, type PatientFile } from '@/modules/files/types'
import type { AnnotationMap } from '@/modules/files/annotations'

const levelTone = { alto: 'danger', moderado: 'warning', informativo: 'neutral' } as const

/** Apartado de oncología del expediente: riesgo, termografías, exploración clínica, campañas y cuestionario. */
export function OncologySection({ patient, record, chart, campaigns, surveys, canWrite, thermalImages, annotations, canUpload }: {
  patient: Patient
  record: ClinicalRecord
  chart: OncologyChart
  campaigns: Campaign[]
  surveys: SurveyResponse[]
  canWrite: boolean
  /** Imágenes térmicas subidas como archivos del expediente (aún sin una termografía interpretada). */
  thermalImages: PatientFile[]
  annotations: AnnotationMap
  canUpload: boolean
}) {
  const { profile, assessment, thermographies, appointments } = chart
  const activeAppointment = appointments.find((a) => a.status === 'programada' || a.status === 'presente')
  const risk = profile.risk
  const gyn = record.history.gynecoObstetric
  const openCampaigns = campaigns.filter((c) => !appointments.some((a) => a.campaign.id === c.id && a.status !== 'cancelada'))

  return (
    <>
      <OncologyDatalists />
      {canWrite && (
        <div className="mb-4 flex flex-wrap gap-2">
          <ThermographyDialog patient={patient} campaigns={campaigns} campaignId={activeAppointment?.campaign.id} />
          <BreastExamDialog patientId={patient.id} />
          <Link href={`/sistema/pacientes/${patient.id}/encuesta`} className={buttonVariants({ variant: 'secondary', size: 'sm' })}><ClipboardList /> Encuesta</Link>
          {openCampaigns.length > 0 && <ScheduleDialog campaigns={openCampaigns} patientId={patient.id} />}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Valoración de riesgo de cáncer de mama"
              description={`${assessment.age} años · orientación según NOM-041-SSA2-2011`}
              action={<Badge tone={riskLevelInfo[assessment.level].tone}>{riskLevelInfo[assessment.level].label}</Badge>}
            />
            <div className="space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              {assessment.factors.length ? (
                <ul className="space-y-2">
                  {assessment.factors.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5 text-[14px] leading-5"><Badge tone={levelTone[f.level]} className="mt-px">{f.level}</Badge>{f.label}</li>
                  ))}
                </ul>
              ) : <p className="text-[14px] text-muted-foreground">Sin factores de riesgo identificados con la información registrada.</p>}
              {assessment.recommendations.length > 0 && (
                <div className="rounded-xl bg-muted/70 p-4">
                  <p className="text-[13px] font-medium text-muted-foreground">Recomendaciones</p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-5">{assessment.recommendations.map((r) => <li key={r}>{r}</li>)}</ul>
                </div>
              )}
              <p className="flex gap-2 text-[12px] leading-5 text-subtle"><Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />Orientación automática; no sustituye el juicio clínico. La termografía es un estudio complementario y no reemplaza a la mastografía.</p>
            </div>
          </Card>

          <SectionTitle>Termografías</SectionTitle>
          {thermographies.map((t) => <ThermographyCard key={t.id} thermography={t} patientId={patient.id} canWrite={canWrite} />)}
          {thermalImages.length > 0 || canUpload ? (
            <Card className="p-5 sm:p-6">
              <CardHeader
                className="p-0 sm:p-0"
                title={`Imágenes térmicas${thermalImages.length ? ` · ${thermalImages.length}` : ''}`}
                description={thermographies.length ? 'Imágenes adjuntas al expediente' : 'Aún sin interpretación: registre la termografía para generar el informe impreso'}
                action={
                  <div className="flex flex-wrap gap-1">
                    {thermalImages.length > 0 && (
                      <Link href={`/sistema/pacientes/${patient.id}/imagenes`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}><PenLine /> {canWrite ? 'Anotar imágenes' : 'Ver imágenes'}</Link>
                    )}
                    {canUpload && <UploadFilesDialog patientId={patient.id} category={THERMAL_CATEGORY} />}
                  </div>
                }
              />
              {thermalImages.length ? <ImageGrid images={thermalImages} annotations={annotations} editorHref={`/sistema/pacientes/${patient.id}/imagenes`} /> : <p className="mt-3 text-[14px] text-muted-foreground">Sin imágenes térmicas.</p>}
            </Card>
          ) : !thermographies.length && <Card><EmptyState icon={ScanHeart} title="Sin termografías registradas" /></Card>}

          <SectionTitle>Exploración clínica de mama</SectionTitle>
          {profile.breastExams.length ? [...profile.breastExams].reverse().map((e) => <BreastExamCard key={e.id} exam={e} />)
            : <Card><EmptyState title="Sin exploraciones registradas" /></Card>}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Campañas" />
            <div className="mt-2 pb-2">
              {appointments.length ? (
                <List>
                  {appointments.map((a) => (
                    <ListItem
                      key={a.id}
                      title={`${formatDate(a.campaign.date, 'medium')} · ${a.time}`}
                      description={<>{[a.campaign.name, visitLabels[a.visit], appointmentOriginLabels[a.origin], a.checkedInAt && `llegó ${formatTime(a.checkedInAt)}`].filter(Boolean).join(' · ')}{(a.log ?? []).map((entry, i) => <span key={i} className="mt-0.5 block text-[12px] text-subtle">{formatLogEntry(entry)}</span>)}</>}
                      trailing={
                        <span className="flex flex-col items-end gap-1.5">
                          <Badge tone={appointmentStatusInfo[a.status].tone}>{appointmentStatusInfo[a.status].label}</Badge>
                          {canWrite && <AppointmentActions patientId={patient.id} appointment={a} />}
                        </span>
                      }
                    />
                  ))}
                </List>
              ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Sin citas en campañas.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Encuesta de psico-oncología" />
            <div className="mt-2 pb-2">
              {surveys.length ? (
                <List>
                  {surveys.map((s) => (
                    <ListItem key={s.id} href={`/sistema/pacientes/${patient.id}/encuesta/${s.id}`} title={formatDateTime(s.createdAt)} description={`${answeredCount(s.answers)} de ${psychoSurveyQuestions.length} contestadas · ${s.appliedBy}${s.recorded ? ` · ${s.recorded.location}` : ''}`} />
                  ))}
                </List>
              ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Sin aplicar.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Cuestionario de tamizaje"
              description={profile.screening ? formatStamp(profile.screening.recorded) ?? `${profile.screening.source === 'preregistro' ? 'Preregistro' : 'Consulta'}${profile.screening.submittedAt ? ` · ${formatDateTime(profile.screening.submittedAt)}` : ''}` : undefined}
              action={canWrite && <ScreeningDialog patientId={patient.id} screening={profile.screening} />}
            />
            <DescriptionList className="mt-2 pb-2">
              <DescriptionItem label="Familiar con cáncer">{answer(profile.screening?.familyCancer)}</DescriptionItem>
              <DescriptionItem label="Mastografía previa">{answer(profile.screening?.previousMammography)}</DescriptionItem>
              <DescriptionItem label="Se autoexplora">{answer(profile.screening?.breastSelfExam)}</DescriptionItem>
              <DescriptionItem label="Química sanguínea reciente">{answer(profile.screening?.recentBloodChemistry)}</DescriptionItem>
              <DescriptionItem label="Puede hacerla o traerla">{answer(profile.screening?.canBringBloodChemistry)}{profile.screening?.bloodChemistryReason && ` · ${profile.screening.bloodChemistryReason}`}</DescriptionItem>
            </DescriptionList>
          </Card>

          <Card>
            <CardHeader title="Factores de riesgo" description={formatStamp(risk?.recorded, 'Actualizó')} action={canWrite && <RiskFactorsDialog patientId={patient.id} risk={risk} />} />
            {risk ? (
              <DescriptionList className="mt-2 pb-2">
                <DescriptionItem label="Familiares con cáncer">{risk.familyCancers.length ? risk.familyCancers.map((f) => `${f.relative}: ${f.cancerType}${f.ageAtDiagnosis ? ` (${f.ageAtDiagnosis} a)` : ''}`).join(' · ') : 'Negados'}</DescriptionItem>
                <DescriptionItem label="Antecedentes personales">{personalHistory(risk) || 'Negados'}</DescriptionItem>
                <DescriptionItem label="1er embarazo · lactancia">{risk.firstPregnancyAge ? `${risk.firstPregnancyAge} años` : '—'} · {risk.breastfeedingMonths !== undefined ? `${risk.breastfeedingMonths} meses` : '—'}</DescriptionItem>
                <DescriptionItem label="Última mastografía">{risk.lastMammography ? `${formatDate(risk.lastMammography, 'medium')}${risk.lastMammographyBirads ? ` · BI-RADS ${risk.lastMammographyBirads}` : ''}` : '—'}</DescriptionItem>
                <DescriptionItem label="Síntomas">{risk.symptoms.length ? risk.symptoms.join(', ') : 'Asintomática'}</DescriptionItem>
                {risk.notes && <DescriptionItem label="Notas">{risk.notes}</DescriptionItem>}
              </DescriptionList>
            ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Sin registrar.</p>}
          </Card>

          <Card>
            <CardHeader
              title="Gineco-obstétricos"
              action={<Link href={`/sistema/pacientes/${patient.id}?seccion=historia`} className="text-[13px] font-medium text-accent-foreground hover:underline">Editar</Link>}
            />
            <DescriptionList className="mt-2 pb-2">
              <DescriptionItem label="Menarca · menopausia">{gyn?.menarche ? `${gyn.menarche} años` : '—'} · {gyn?.menopause ? `${gyn.menopause} años` : '—'}</DescriptionItem>
              <DescriptionItem label="G · P · C · A">{[gyn?.pregnancies, gyn?.births, gyn?.cesareans, gyn?.abortions].map((n) => n ?? '—').join(' · ')}</DescriptionItem>
              <DescriptionItem label="FUM">{gyn?.lastMenstrualPeriod ? formatDate(gyn.lastMenstrualPeriod, 'medium') : '—'}</DescriptionItem>
            </DescriptionList>
          </Card>
        </div>
      </div>
    </>
  )
}

function answer(value?: keyof typeof answerLabels) {
  return value ? answerLabels[value] : '—'
}

function personalHistory(risk: NonNullable<OncologyChart['profile']['risk']>) {
  return [
    risk.personalBreastCancer && 'Cáncer de mama',
    risk.personalOtherCancer,
    risk.previousBiopsy && (risk.atypicalHyperplasia ? 'Biopsia con atipia' : 'Biopsia previa'),
    risk.chestRadiation && 'Radioterapia en tórax',
    risk.hormoneTherapy && `Terapia hormonal${risk.hormoneTherapyDetail ? ` (${risk.hormoneTherapyDetail})` : ''}`,
    risk.knownMutation && `Mutación ${risk.knownMutation}`,
    risk.breastImplants && 'Implantes mamarios',
  ].filter(Boolean).join(' · ')
}

function ThermalSideRow({ label, side }: { label: string; side: ThermalSide }) {
  return (
    <tr className="border-t border-separator">
      <th scope="row" className="py-2.5 pr-3 text-left font-medium">{label}</th>
      <td className="py-2.5 pr-3"><Badge tone={thermalGradeInfo[side.grade].tone}>{side.grade}</Badge> <span className="text-muted-foreground">{thermalGradeInfo[side.grade].label}</span></td>
      <td className="py-2.5 pr-3 tabular-nums">{side.maxTemp ?? '—'}{side.meanTemp !== undefined && <span className="text-muted-foreground"> / {side.meanTemp}</span>}</td>
      <td className="py-2.5 pr-3">{side.vascularPattern ? vascularPatternLabels[side.vascularPattern] : '—'}</td>
      <td className="py-2.5">{side.hotSpots ?? '—'}</td>
    </tr>
  )
}

function ThermographyCard({ thermography: t, patientId, canWrite }: { thermography: Thermography; patientId: string; canWrite: boolean }) {
  return (
    <Card>
      <CardHeader
        title={<span className="flex flex-wrap items-center gap-2">{t.folio} <Badge tone={thermalGradeInfo[t.grade].tone}>{t.grade} · {thermalGradeInfo[t.grade].label}</Badge></span>}
        description={`${formatDateTime(t.performedAt)} · ${t.performedBy}${t.recorded ? ` · ${t.recorded.location}` : ''}${t.equipment ? ` · ${t.equipment}` : ''}${t.roomTemp ? ` · sala ${t.roomTemp} °C` : ''}${t.acclimatizationMin ? ` · aclimatación ${t.acclimatizationMin} min` : ''}`}
        action={
          <div className="flex flex-wrap gap-1">
            <Link href={`/sistema/pacientes/${patientId}/termografia/${t.id}/informe`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}><FileText /> Informe</Link>
            {canWrite && <ThermographyImagesDialog patientId={patientId} thermographyId={t.id} />}
          </div>
        }
      />
      <div className="space-y-4 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[520px] text-[14px]">
            <thead className="text-left text-[12px] text-muted-foreground">
              <tr><th className="pb-2 font-medium" /><th className="pb-2 font-medium">Clasificación</th><th className="pb-2 font-medium">T. máx / media (°C)</th><th className="pb-2 font-medium">Patrón vascular</th><th className="pb-2 font-medium">Zonas hipertérmicas</th></tr>
            </thead>
            <tbody>
              <ThermalSideRow label="Derecha" side={t.right} />
              <ThermalSideRow label="Izquierda" side={t.left} />
            </tbody>
          </table>
        </div>
        {t.deltaT !== undefined && (
          <p className="text-[14px]">Diferencia térmica entre mamas: <strong className="tabular-nums">{t.deltaT} °C</strong>{t.asymmetry && <Badge tone="warning" className="ml-2">Asimetría significativa</Badge>}</p>
        )}
        <p className="whitespace-pre-line leading-6">{t.findings}</p>
        <p className="flex flex-wrap items-center gap-2 text-[14px]">
          <span className="text-muted-foreground">Recomendación:</span>
          <Badge tone={recommendationInfo[t.recommendation].tone}>{recommendationInfo[t.recommendation].label}</Badge>
          {t.recommendationDetail && <span>{t.recommendationDetail}</span>}
        </p>
        {t.images.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {t.images.map((image) => (
              <li key={image.id}>
                <a href={`/sistema/archivos/${image.id}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- archivo protegido por sesión; el optimizador de imágenes no envía la cookie */}
                  <img src={`/sistema/archivos/${image.id}`} alt={image.label ?? image.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                </a>
                <p className="mt-1 truncate text-[12px] text-muted-foreground">{image.label ?? image.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

function BreastSideText({ side }: { side: BreastSide }) {
  return (
    <>
      {side.findings.join(', ')}
      {side.quadrant && ` · ${side.quadrant}`}
      {side.sizeCm !== undefined && ` · ${side.sizeCm} cm`}
      {side.axillaryNodes && ' · adenopatía axilar'}
      {side.notes && ` · ${side.notes}`}
    </>
  )
}

function BreastExamCard({ exam }: { exam: BreastExam }) {
  const normal = [exam.right, exam.left].every((s) => s.findings.every((f) => f === 'Sin alteraciones') && !s.axillaryNodes)
  return (
    <Card>
      <CardHeader title={formatDateTime(exam.at)} description={`${exam.examiner}${exam.recorded ? ` · ${exam.recorded.location}` : ''}`} action={<Badge tone={normal ? 'success' : 'warning'}>{normal ? 'Sin alteraciones' : 'Con hallazgos'}</Badge>} />
      <DescriptionList className="mt-2 pb-2">
        <DescriptionItem label="Mama derecha"><BreastSideText side={exam.right} /></DescriptionItem>
        <DescriptionItem label="Mama izquierda"><BreastSideText side={exam.left} /></DescriptionItem>
        {exam.impression && <DescriptionItem label="Impresión">{exam.impression}</DescriptionItem>}
      </DescriptionList>
    </Card>
  )
}
