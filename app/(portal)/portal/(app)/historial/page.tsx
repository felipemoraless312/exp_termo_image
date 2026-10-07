import { PageHeader } from '@/components/ui/page-header'
import { getPortalChart } from '@/modules/patients/data'
import { buildTimeline } from '@/modules/patients/timeline'
import { HistoryTimeline } from '@/modules/patients/components/history-timeline'

export const metadata = { title: 'Historial clínico' }

export default async function MyHistoryPage() {
  const { viewer, patient, record } = await getPortalChart('historial')

  return (
    <>
      <PageHeader
        title={viewer.kind === 'paciente' ? 'Mi historial clínico' : 'Historial clínico'}
        description="Todo lo registrado en el expediente, del más reciente al más antiguo: consultas, estudios, tratamientos, diagnósticos y antecedentes."
      />
      <HistoryTimeline events={buildTimeline(patient, record)} />
    </>
  )
}
