import { PageHeader } from '@/components/ui/page-header'
import { getPortalChart } from '@/modules/patients/data'
import { NoteTimeline } from '@/modules/patients/components/clinical-chart'

export const metadata = { title: 'Mis consultas' }

export default async function MyConsultationsPage() {
  const { viewer, record } = await getPortalChart('consultas')

  return (
    <>
      <PageHeader title={viewer.kind === 'paciente' ? 'Mis consultas' : 'Consultas'} description="Resumen de las consultas con diagnóstico, indicaciones y plan." />
      <NoteTimeline notes={record.notes} />
    </>
  )
}
