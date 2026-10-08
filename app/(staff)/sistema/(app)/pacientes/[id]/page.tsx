import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, FilePlus2, Pencil, ScrollText, UserCheck } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkTabs } from '@/components/ui/link-tabs'
import { DescriptionItem, DescriptionList, List, ListItem } from '@/components/ui/list'
import { SectionTitle } from '@/components/ui/page-header'
import { listPatientContacts } from '@/modules/access/data'
import { accessScopes } from '@/modules/access/types'
import { auditActionLabels, auditRoleLabels } from '@/modules/audit/log'
import { canAccess, type StaffRole } from '@/modules/auth/permissions'
import { PatientFilesSection } from '@/modules/files/components/patient-files'
import { getPatientFiles } from '@/modules/files/data'
import { THERMAL_CATEGORY } from '@/modules/files/types'
import { requireStaff } from '@/modules/auth/session'
import { allergyKindLabels, sexLabels } from '@/modules/catalogs/clinical'
import { getPatientChart, listRecordEvents } from '@/modules/patients/data'
import { buildTimeline } from '@/modules/patients/timeline'
import { HistoryTimeline } from '@/modules/patients/components/history-timeline'
import { news2 } from '@/modules/patients/clinical-rules'
import { noteTemplates, noteTypes } from '@/modules/patients/note-templates'
import { patientStatus, type ClinicalRecord, type Patient } from '@/modules/patients/types'
import { formatAddress, formatContact, insuranceLabel } from '@/modules/patients/display'
import { formatStamp } from '@/modules/patients/stamp'
import { getOncologyChart, listCampaigns, listPatientSurveys } from '@/modules/oncology/data'
import { OncologySection } from '@/modules/oncology/components/oncology-section'
import {
  AllergyNotice, ConsentList, StampNote, DeviceList, DeviceNotice, DocumentsList, MedicationList, NoteTimeline, ProblemList, StudyCard, VitalsCard, VitalsTable,
} from '@/modules/patients/components/clinical-chart'
import {
  AllergyDialog, ChartDatalists, ConsentDialog, DeviceDialog, FamilyHistoryDialog, HistoryDialog, HospitalizationDialog, ImmunizationDialog,
  MedicationStatusDialog, OrderStudyDialog, PrescribeDialog, ProblemDialog, ProblemStatusActions, RemoveAllergyDialog, RevokeConsentButton,
  StudyActions, SurgeryDialog, VitalsDialog,
} from '@/modules/patients/components/chart-forms'
import { ageFrom, formatDate, formatDateTime } from '@/lib/format'

const sections = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'oncologia', label: 'Oncología' },
  { key: 'cronologia', label: 'Línea de tiempo' },
  { key: 'historia', label: 'Historia clínica' },
  { key: 'notas', label: 'Notas' },
  { key: 'signos', label: 'Signos vitales' },
  { key: 'tratamiento', label: 'Tratamiento' },
  { key: 'estudios', label: 'Estudios' },
  { key: 'dispositivos', label: 'Dispositivos' },
  { key: 'consentimientos', label: 'Consentimientos y documentos' },
  { key: 'accesos', label: 'Accesos y bitácora' },
] as const
type Section = (typeof sections)[number]['key']

export async function generateMetadata({ params }: PageProps<'/sistema/pacientes/[id]'>) {
  const chart = await getPatientChart((await params).id)
  return { title: chart?.patient.name ?? 'Expediente' }
}

export default async function PatientChartPage({ params, searchParams }: PageProps<'/sistema/pacientes/[id]'>) {
  const [{ id }, query, user] = await Promise.all([params, searchParams, requireStaff('record')])
  const chart = await getPatientChart(id)
  if (!chart) notFound()
  const { patient, record } = chart

  const visible = sections.filter((s) => (s.key !== 'accesos' || canAccess(user.role, 'audit')) && (s.key !== 'oncologia' || canAccess(user.role, 'oncology')))
  const current: Section = visible.find((s) => s.key === query.seccion)?.key ?? 'resumen'
  const can = (area: Parameters<typeof canAccess>[1]) => canAccess(user.role, area)
  const counts: Partial<Record<Section, number>> = {
    notas: record.notes.length,
    tratamiento: record.medications.filter((m) => m.status === 'activo').length,
    estudios: record.studies.filter((s) => s.status === 'solicitado' || s.status === 'en-proceso').length,
    dispositivos: record.devices.length,
  }
  const latest = record.vitals.at(-1)
  const score = latest ? news2(latest) : undefined

  return (
    <>
      <Link href="/sistema/pacientes" className="no-print -ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> Pacientes
      </Link>

      <header className="flex flex-wrap items-center gap-5">
        <Avatar src={patient.photo} name={patient.name} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-title-1">{patient.name}</h1>
            <Badge tone={patientStatus[patient.status].tone}>{patientStatus[patient.status].label}</Badge>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            {patient.record} · {ageFrom(patient.birthDate)} años · {sexLabels[patient.sex]} · {patient.bloodType} · {insuranceLabel(patient.insurance)}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          {can('vitals') && <VitalsDialog patient={patient} />}
          {(can('notes.medical') || can('notes.nursing')) && (
            <Link href={`/sistema/pacientes/${patient.id}/notas/nueva`} className={buttonVariants({ size: 'sm' })}><FilePlus2 /> Nueva nota</Link>
          )}
        </div>
      </header>

      <div className="mt-6 space-y-3">
        <AllergyNotice patient={patient} />
        <DeviceNotice devices={record.devices} />
        {score && score.risk !== 'bajo' && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-danger-soft p-4 text-[14px] text-danger">
            <Badge tone="danger">NEWS2 {score.score}</Badge>
            <span>{score.response} Último registro: {formatDateTime(latest!.takenAt)}.</span>
          </div>
        )}
      </div>

      <LinkTabs
        className="no-print mt-8"
        label="Secciones del expediente"
        current={current}
        items={visible.map((s) => ({ key: s.key, label: s.label, count: counts[s.key], href: s.key === 'resumen' ? `/sistema/pacientes/${patient.id}` : `/sistema/pacientes/${patient.id}?seccion=${s.key}` }))}
      />

      <ChartDatalists />

      <div className="mt-6">
        {current === 'resumen' && <SummarySection patient={patient} record={record} role={user.role} />}
        {current === 'oncologia' && <OncologyTab patient={patient} record={record} canWrite={can('oncology.write')} canUpload={can('files.upload')} />}
        {current === 'cronologia' && <HistoryTimeline events={buildTimeline(patient, record)} hrefFor={(noteId) => `/sistema/pacientes/${patient.id}/notas/${noteId}`} />}
        {current === 'historia' && <HistorySection patient={patient} record={record} role={user.role} />}
        {current === 'notas' && (
          <>
            {(can('notes.medical') || can('notes.nursing')) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {noteTypes.filter((type) => can(noteTemplates[type].permission)).map((type) => (
                  <Link key={type} href={`/sistema/pacientes/${patient.id}/notas/nueva?tipo=${type}`} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>{noteTemplates[type].label}</Link>
                ))}
              </div>
            )}
            <NoteTimeline notes={record.notes} hrefFor={(note) => `/sistema/pacientes/${patient.id}/notas/${note.id}`} />
          </>
        )}
        {current === 'signos' && (
          <>
            {can('vitals') && <div className="mb-4"><VitalsDialog patient={patient} triggerStyle={{ variant: 'primary', size: 'sm' }} /></div>}
            <div className="space-y-4">
              <VitalsCard vitals={latest} />
              <SectionTitle>Historial</SectionTitle>
              <VitalsTable vitals={record.vitals} />
            </div>
          </>
        )}
        {current === 'tratamiento' && (
          <>
            {can('prescribe') && <div className="mb-4"><PrescribeDialog patient={patient} /></div>}
            <Card className="py-1.5">
              <MedicationList
                medications={record.medications.filter((m) => m.status === 'activo')}
                empty="Sin tratamiento activo"
                actions={can('prescribe') ? (m) => <MedicationStatusDialog patientId={patient.id} medication={m} /> : undefined}
              />
            </Card>
            <SectionTitle>Tratamientos anteriores</SectionTitle>
            <Card className="py-1.5"><MedicationList medications={record.medications.filter((m) => m.status !== 'activo')} empty="Sin tratamientos anteriores" /></Card>
          </>
        )}
        {current === 'estudios' && (
          <>
            {can('notes.medical') && <div className="mb-4"><OrderStudyDialog patientId={patient.id} /></div>}
            {record.studies.length ? (
              <div className="space-y-4">
                {record.studies.map((study) => (
                  <StudyCard key={study.id} study={study} actions={study.status !== 'cancelado' ? <StudyActions patientId={patient.id} study={study} canResult={can('studies.result')} /> : undefined} />
                ))}
              </div>
            ) : <Card><EmptyState title="Sin estudios solicitados" /></Card>}
            <PatientFilesSection patientId={patient.id} canUpload={can('files.upload')} />
          </>
        )}
        {current === 'dispositivos' && (
          <>
            {can('record.write') && <div className="mb-4"><DeviceDialog patientId={patient.id} /></div>}
            <Card className="py-1.5"><DeviceList devices={record.devices} /></Card>
          </>
        )}
        {current === 'consentimientos' && (
          <>
            {can('notes.medical') && <div className="mb-4"><ConsentDialog patient={patient} /></div>}
            <Card className="py-1.5"><ConsentList consents={record.consents} actions={can('record.write') ? (c) => <RevokeConsentButton patientId={patient.id} consent={c} /> : undefined} /></Card>
            <SectionTitle>Documentos</SectionTitle>
            <DocumentsList documents={record.documents} />
          </>
        )}
        {current === 'accesos' && <AccessSection patientId={patient.id} />}
      </div>
    </>
  )
}

function SummarySection({ patient, record, role }: { patient: Patient; record: ClinicalRecord; role: StaffRole }) {
  const lastNote = record.notes[0]
  const pending = record.studies.filter((s) => s.status === 'solicitado' || s.status === 'en-proceso')
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <VitalsCard vitals={record.vitals.at(-1)} />
        <Card>
          <CardHeader title="Lista de problemas" description="Diagnósticos codificados con CIE-10" action={canAccess(role, 'record.write') && <ProblemDialog patientId={patient.id} />} />
          <div className="mt-2 pb-2">
            <ProblemList problems={record.problems.filter((p) => p.status !== 'resuelto')} actions={canAccess(role, 'record.write') ? (p) => <ProblemStatusActions patientId={patient.id} problem={p} /> : undefined} />
          </div>
        </Card>
        {lastNote && (
          <Card>
            <CardHeader title="Última nota" description={<Link href={`/sistema/pacientes/${patient.id}?seccion=cronologia`} className="text-accent-foreground hover:underline">Ver el historial completo</Link>} action={<Link href={`/sistema/pacientes/${patient.id}/notas/${lastNote.id}`} className="text-[13px] font-medium text-accent-foreground hover:underline">Ver completa</Link>} />
            <div className="p-5 pt-2 sm:p-6 sm:pt-2"><NoteTimelineItem note={lastNote} /></div>
          </Card>
        )}
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader title="Tratamiento activo" action={<Link href={`/sistema/pacientes/${patient.id}?seccion=tratamiento`} className="text-[13px] font-medium text-accent-foreground hover:underline">Ver todo</Link>} />
          <div className="mt-2 pb-2"><MedicationList medications={record.medications.filter((m) => m.status === 'activo')} empty="Sin tratamiento activo" /></div>
        </Card>
        <Card>
          <CardHeader title="Estudios pendientes" />
          <div className="mt-2 pb-2">
            {pending.length ? (
              <List>{pending.map((s) => <ListItem key={s.id} title={s.name} description={`${s.folio} · ${formatDate(s.orderedAt, 'medium')}${s.priority === 'urgente' ? ' · Urgente' : ''}`} href={`/sistema/pacientes/${patient.id}?seccion=estudios`} />)}</List>
            ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Sin estudios pendientes.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Contacto" />
          <DescriptionList className="mt-2 pb-2">
            <DescriptionItem label="Teléfono">{patient.phone}</DescriptionItem>
            <DescriptionItem label="Emergencia">{formatContact(patient.emergencyContact)}</DescriptionItem>
          </DescriptionList>
        </Card>
      </div>
    </div>
  )
}

function NoteTimelineItem({ note }: { note: ClinicalRecord['notes'][number] }) {
  const summary = note.sections.plan ?? note.sections.subjetivo ?? Object.values(note.sections)[0]
  return (
    <>
      <p className="text-[13px] text-muted-foreground">{noteTemplates[note.type].label} · {formatDateTime(note.createdAt)} · {note.author}</p>
      {note.diagnoses.length > 0 && <p className="mt-1 text-[13px] text-accent-foreground">{note.diagnoses.map((d) => `${d.code ?? ''} ${d.description}`.trim()).join(' · ')}</p>}
      <p className="mt-2 line-clamp-4 leading-6">{summary}</p>
    </>
  )
}

function HistorySection({ patient, record, role }: { patient: Patient; record: ClinicalRecord; role: StaffRole }) {
  const write = canAccess(role, 'record.write')
  const { history } = record
  const np = history.nonPathological
  const go = history.gynecoObstetric
  const smoking = np.smoking === 'nunca' ? 'Niega tabaquismo' : `${np.smoking === 'actual' ? 'Fumador actual' : 'Exfumador'}${np.cigarettesPerDay && np.smokingYears ? ` · índice tabáquico ${((np.cigarettesPerDay * np.smokingYears) / 20).toFixed(1)} paquetes-año` : ''}`
  const alcohol = { no: 'Niega consumo de alcohol', ocasional: 'Consumo ocasional', frecuente: 'Consumo frecuente' }[np.alcohol] + (np.alcoholDetail ? ` · ${np.alcoholDetail}` : '')

  return (
    <div className="space-y-2">
      <SectionTitle action={canAccess(role, 'patients.write') && <Link href={`/sistema/pacientes/${patient.id}/editar`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}><Pencil /> Editar</Link>}>Ficha de identificación</SectionTitle>
      <Card className="py-1.5">
        <DescriptionList>
          <DescriptionItem label="Nombre completo">{patient.name}</DescriptionItem>
          <DescriptionItem label="CURP">{patient.curp ?? 'No registrada'}</DescriptionItem>
          <DescriptionItem label="Fecha y lugar de nacimiento">{formatDate(patient.birthDate)} ({ageFrom(patient.birthDate)} años){patient.birthPlace && ` · ${patient.birthPlace}`}</DescriptionItem>
          <DescriptionItem label="Sexo · estado civil">{sexLabels[patient.sex]}{patient.maritalStatus && ` · ${patient.maritalStatus}`}</DescriptionItem>
          <DescriptionItem label="Escolaridad · ocupación">{[patient.education, patient.occupation].filter(Boolean).join(' · ') || '—'}</DescriptionItem>
          {(patient.religion || patient.indigenousLanguage) && <DescriptionItem label="Religión · lengua">{[patient.religion, patient.indigenousLanguage].filter(Boolean).join(' · ')}</DescriptionItem>}
          <DescriptionItem label="Domicilio">{formatAddress(patient.address)}</DescriptionItem>
          <DescriptionItem label="Teléfono · correo">{patient.phone}{patient.email && ` · ${patient.email}`}</DescriptionItem>
          <DescriptionItem label="Afiliación">{insuranceLabel(patient.insurance)}</DescriptionItem>
          <DescriptionItem label="Contacto de emergencia">{formatContact(patient.emergencyContact)}</DescriptionItem>
          <DescriptionItem label="Alta del expediente">{formatStamp(patient.registered) ?? formatDateTime(patient.createdAt)}</DescriptionItem>
          {patient.updated && <DescriptionItem label="Última actualización">{formatStamp(patient.updated, 'Actualizó')}</DescriptionItem>}
          {patient.legalGuardian && <DescriptionItem label="Responsable legal">{patient.legalGuardian.name} ({patient.legalGuardian.relationship}) · {patient.legalGuardian.phone}</DescriptionItem>}
        </DescriptionList>
      </Card>

      <SectionTitle action={write && <AllergyDialog patientId={patient.id} />}>Alergias</SectionTitle>
      <Card className="py-1.5">
        {patient.allergies.length ? (
          <List>
            {patient.allergies.map((a) => (
              <ListItem key={a.id} title={a.agent} description={<>{allergyKindLabels[a.kind]} · {a.reaction} · registrada {formatDate(a.recordedAt, 'medium')}<StampNote registered={a.registered} /></>}
                trailing={<span className="flex items-center gap-2"><Badge tone={a.severity === 'grave' ? 'danger' : 'warning'}>{a.severity}</Badge>{write && <RemoveAllergyDialog patientId={patient.id} allergyId={a.id} agent={a.agent} />}</span>} />
            ))}
          </List>
        ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Alergias negadas.</p>}
      </Card>

      <SectionTitle action={write && <FamilyHistoryDialog patientId={patient.id} />}>Antecedentes heredofamiliares</SectionTitle>
      <Card className="py-1.5">
        {history.family.length ? (
          <List>{history.family.map((f) => <ListItem key={f.id} title={f.condition} description={<>{[f.relative, f.notes].filter(Boolean).join(' · ')}<StampNote registered={f.registered} /></>} />)}</List>
        ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Interrogados y negados.</p>}
      </Card>

      <SectionTitle action={write && <ProblemDialog patientId={patient.id} />}>Personales patológicos</SectionTitle>
      <Card className="py-1.5">
        <ProblemList problems={record.problems} actions={write ? (p) => <ProblemStatusActions patientId={patient.id} problem={p} /> : undefined} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <SectionTitle action={write && <SurgeryDialog patientId={patient.id} />}>Quirúrgicos</SectionTitle>
          <Card className="py-1.5">
            {history.surgeries.length ? (
              <List>{history.surgeries.map((s) => <ListItem key={s.id} title={s.procedure} description={<>{[formatDate(s.date, 'medium'), s.hospital, s.complications].filter(Boolean).join(' · ')}<StampNote registered={s.registered} /></>} />)}</List>
            ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Niega antecedentes quirúrgicos.</p>}
          </Card>
        </div>
        <div>
          <SectionTitle action={write && <HospitalizationDialog patientId={patient.id} />}>Hospitalizaciones</SectionTitle>
          <Card className="py-1.5">
            {history.hospitalizations.length ? (
              <List>{history.hospitalizations.map((h) => <ListItem key={h.id} title={h.reason} description={<>{formatDate(h.date, 'medium')}{h.days !== undefined ? ` · ${h.days} días` : ''}<StampNote registered={h.registered} /></>} />)}</List>
            ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Niega hospitalizaciones previas.</p>}
          </Card>
        </div>
      </div>

      <SectionTitle action={write && <HistoryDialog patient={patient} history={history} />}>Personales no patológicos y otros</SectionTitle>
      <Card className="py-1.5">
        <DescriptionList>
          <DescriptionItem label="Tabaquismo">{smoking}</DescriptionItem>
          <DescriptionItem label="Alcohol">{alcohol}</DescriptionItem>
          <DescriptionItem label="Otras sustancias">{np.drugs ?? '—'}</DescriptionItem>
          <DescriptionItem label="Actividad física">{np.physicalActivity ?? '—'}</DescriptionItem>
          <DescriptionItem label="Alimentación">{np.diet ?? '—'}</DescriptionItem>
          <DescriptionItem label="Sueño">{np.sleep ?? '—'}</DescriptionItem>
          <DescriptionItem label="Vivienda">{np.housing ?? '—'}</DescriptionItem>
          <DescriptionItem label="Zoonosis">{np.zoonosis ?? '—'}</DescriptionItem>
          <DescriptionItem label="Transfusiones">{history.transfusions ?? '—'}</DescriptionItem>
          <DescriptionItem label="Traumatismos">{history.traumas ?? '—'}</DescriptionItem>
          {history.updated && <DescriptionItem label="Última actualización">{formatStamp(history.updated, 'Actualizó')}</DescriptionItem>}
        </DescriptionList>
      </Card>

      {patient.sex === 'mujer' && (
        <>
          <SectionTitle>Gineco-obstétricos</SectionTitle>
          <Card className="py-1.5">
            {go ? (
              <DescriptionList>
                <DescriptionItem label="Menarca · ritmo">{go.menarche ? `${go.menarche} años` : '—'}{go.cycles && ` · ${go.cycles}`}</DescriptionItem>
                <DescriptionItem label="FUM">{go.lastMenstrualPeriod ? formatDate(go.lastMenstrualPeriod) : go.menopause ? `Menopausia a los ${go.menopause} años` : '—'}</DescriptionItem>
                <DescriptionItem label="G · P · C · A">{[go.pregnancies, go.births, go.cesareans, go.abortions].map((n) => n ?? '—').join(' · ')}</DescriptionItem>
                <DescriptionItem label="IVSA · método anticonceptivo">{go.sexualOnset ? `${go.sexualOnset} años` : '—'}{go.contraception && ` · ${go.contraception}`}</DescriptionItem>
                <DescriptionItem label="Última citología · mastografía">{go.lastPap ? formatDate(go.lastPap, 'medium') : '—'} · {go.lastMammography ? formatDate(go.lastMammography, 'medium') : '—'}</DescriptionItem>
              </DescriptionList>
            ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Sin registrar. Usa “Editar” en el apartado anterior.</p>}
          </Card>
        </>
      )}

      <SectionTitle action={write && <ImmunizationDialog patientId={patient.id} />}>Inmunizaciones</SectionTitle>
      <Card className="py-1.5">
        {history.immunizations.length ? (
          <List>{history.immunizations.map((i) => <ListItem key={i.id} title={i.vaccine} description={<>{i.dose} · {formatDate(i.date, 'medium')}{i.lot ? ` · lote ${i.lot}` : ''}<StampNote registered={i.registered} /></>} />)}</List>
        ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Sin vacunas registradas.</p>}
      </Card>
    </div>
  )
}

async function OncologyTab({ patient, record, canWrite, canUpload }: { patient: Patient; record: ClinicalRecord; canWrite: boolean; canUpload: boolean }) {
  const [chart, campaigns, surveys, files] = await Promise.all([getOncologyChart(patient.id), listCampaigns(), listPatientSurveys(patient.id), getPatientFiles(patient.id)])
  if (!chart) return <Card><EmptyState title="No se pudo cargar el apartado de oncología" /></Card>
  const thermalImages = files.filter((f) => f.label === THERMAL_CATEGORY && f.contentType.startsWith('image/'))
  return <OncologySection patient={patient} record={record} chart={chart} campaigns={campaigns} surveys={surveys} canWrite={canWrite} thermalImages={thermalImages} canUpload={canUpload} />
}

async function AccessSection({ patientId }: { patientId: string }) {
  const [contacts, events] = await Promise.all([listPatientContacts(patientId), listRecordEvents(patientId)])
  const active = contacts.filter((c) => !c.revokedAt)
  return (
    <>
      <SectionTitle>Contactos autorizados por el paciente</SectionTitle>
      <Card className="py-1.5">
        {contacts.length ? (
          <List>
            {contacts.map((c) => (
              <ListItem
                key={c.id}
                leading={<UserCheck size={18} className="text-muted-foreground" aria-hidden="true" />}
                title={`${c.name} · ${c.relationship}`}
                description={`${accessScopes[c.scope].label} · ${c.phone} · autorizado ${formatDate(c.createdAt, 'medium')}${c.lastAccessAt ? ` · último acceso ${formatDateTime(c.lastAccessAt)}` : ''}${c.revokedAt ? ` · revocado ${formatDate(c.revokedAt, 'medium')}` : ''}`}
                trailing={<Badge tone={c.revokedAt ? 'neutral' : 'success'}>{c.revokedAt ? 'Revocado' : 'Vigente'}</Badge>}
              />
            ))}
          </List>
        ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">El paciente no ha autorizado a ningún contacto.</p>}
      </Card>
      <p className="mt-2 px-1 text-[13px] text-subtle">{active.length} autorización(es) vigente(s). El paciente las administra desde su portal.</p>

      <SectionTitle>Bitácora</SectionTitle>
      <p className="mb-4 flex items-center gap-2 text-[14px] text-muted-foreground"><ScrollText size={16} aria-hidden="true" /> Registro de consultas y modificaciones a este expediente (NOM-024-SSA3-2012).</p>
      <Card className="py-1.5">
        {events.length ? (
          <List>{events.map((e) => <ListItem key={e.id} title={e.summary} description={`${formatDateTime(e.at)} · ${e.actorName} (${auditRoleLabels[e.actorRole]})`} trailing={<Badge>{auditActionLabels[e.action]}</Badge>} />)}</List>
        ) : <EmptyState title="Sin eventos registrados desde el arranque del servidor" />}
      </Card>
    </>
  )
}
