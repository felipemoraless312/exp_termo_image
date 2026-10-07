import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DescriptionItem, DescriptionList } from '@/components/ui/list'
import { PageHeader, SectionTitle } from '@/components/ui/page-header'
import { sexLabels } from '@/modules/catalogs/clinical'
import { getPortalCampaigns } from '@/modules/oncology/data'
import { answerLabels, appointmentStatusInfo } from '@/modules/oncology/types'
import { getPortalChart } from '@/modules/patients/data'
import { formatAddress, pendingLabel } from '@/modules/patients/display'
import { formatStamp } from '@/modules/patients/stamp'
import { formatDate } from '@/lib/format'
import { EditInformationDialog } from './edit-information-dialog'

export const metadata = { title: 'Mis datos' }

export default async function MyInformationPage() {
  const [{ viewer, patient, record }, oncology] = await Promise.all([getPortalChart(), getPortalCampaigns()])
  const isPatient = viewer.kind === 'paciente'
  const problems = record.problems.filter((p) => p.status !== 'resuelto')
  const screening = oncology.screening

  return (
    <>
      <PageHeader
        title={isPatient ? 'Mis datos' : 'Datos del paciente'}
        description={isPatient ? 'Revisa tu información y mantenla al día. Nombre, fecha de nacimiento y CURP solo se corrigen en la clínica.' : 'Información registrada en el expediente.'}
        actions={isPatient && <EditInformationDialog patient={patient} />}
      />

      {oncology.appointments.length > 0 && (
        <>
          <SectionTitle>{isPatient ? 'Mi cita en la campaña' : 'Cita en la campaña'}</SectionTitle>
          <Card className="py-1.5">
            <DescriptionList>
              {oncology.appointments.map((a) => (
                <DescriptionItem key={a.id} label={a.campaign.name}>
                  <span className="inline-flex flex-wrap items-center justify-end gap-2">
                    {formatDate(a.campaign.date)} · {a.time} h{a.campaign.location && ` · ${a.campaign.location}`}
                    <Badge tone={appointmentStatusInfo[a.status].tone}>{appointmentStatusInfo[a.status].label}</Badge>
                  </span>
                </DescriptionItem>
              ))}
            </DescriptionList>
          </Card>
        </>
      )}

      <SectionTitle>Datos personales</SectionTitle>
      <Card className="py-1.5">
        <DescriptionList>
          <DescriptionItem label="Nombre">{patient.name}</DescriptionItem>
          <DescriptionItem label="Expediente">{patient.record}</DescriptionItem>
          <DescriptionItem label="Fecha de nacimiento">{formatDate(patient.birthDate)}</DescriptionItem>
          <DescriptionItem label="Sexo">{sexLabels[patient.sex]}</DescriptionItem>
          <DescriptionItem label="Estado civil · escolaridad">{[patient.maritalStatus, patient.education].filter(Boolean).join(' · ') || '—'}</DescriptionItem>
          <DescriptionItem label="Ocupación">{patient.occupation ?? '—'}</DescriptionItem>
          <DescriptionItem label="Teléfono">{patient.phone}</DescriptionItem>
          <DescriptionItem label="Correo">{patient.email ?? '—'}</DescriptionItem>
          <DescriptionItem label="Domicilio">{formatAddress(patient.address)}</DescriptionItem>
          {patient.updated && <DescriptionItem label="Última actualización">{formatStamp(patient.updated, 'Actualizó')}</DescriptionItem>}
        </DescriptionList>
      </Card>

      <SectionTitle>Contacto de emergencia</SectionTitle>
      <Card className="py-1.5">
        <DescriptionList>
          <DescriptionItem label="Nombre">{patient.emergencyContact.name || pendingLabel}</DescriptionItem>
          <DescriptionItem label="Parentesco">{patient.emergencyContact.relationship || '—'}</DescriptionItem>
          <DescriptionItem label="Teléfono">{patient.emergencyContact.phone || '—'}</DescriptionItem>
        </DescriptionList>
      </Card>

      {screening && (
        <>
          <SectionTitle>{isPatient ? 'Mis respuestas del cuestionario' : 'Cuestionario de tamizaje'}</SectionTitle>
          <Card className="py-1.5">
            <DescriptionList>
              <DescriptionItem label="¿Algún familiar con cáncer?">{screening.familyCancer ? answerLabels[screening.familyCancer] : '—'}</DescriptionItem>
              <DescriptionItem label="¿Se ha hecho mastografía?">{screening.previousMammography ? answerLabels[screening.previousMammography] : '—'}</DescriptionItem>
              <DescriptionItem label="¿Se autoexplora los senos?">{screening.breastSelfExam ? answerLabels[screening.breastSelfExam] : '—'}</DescriptionItem>
              <DescriptionItem label="¿Química sanguínea reciente?">{screening.recentBloodChemistry ? answerLabels[screening.recentBloodChemistry] : '—'}</DescriptionItem>
            </DescriptionList>
          </Card>
          <p className="mt-2 px-1 text-[13px] text-subtle">Si alguna respuesta cambió, avísale al personal el día de tu cita.</p>
        </>
      )}

      <SectionTitle>Información médica</SectionTitle>
      <Card className="py-1.5">
        <DescriptionList>
          <DescriptionItem label="Alergias">{patient.allergies.length ? patient.allergies.map((a) => a.agent).join(', ') : 'Sin alergias registradas'}</DescriptionItem>
          <DescriptionItem label="Grupo sanguíneo">{patient.bloodType}</DescriptionItem>
          <DescriptionItem label="Diagnósticos">{problems.length ? problems.map((p) => p.description).join('; ') : '—'}</DescriptionItem>
          {record.devices.length > 0 && <DescriptionItem label="Dispositivos implantados">{record.devices.map((d) => `${d.type} ${d.brand}`).join('; ')}</DescriptionItem>}
        </DescriptionList>
      </Card>
    </>
  )
}
