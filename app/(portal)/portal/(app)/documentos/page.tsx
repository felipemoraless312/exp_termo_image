import { Download } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { NotifyButton } from '@/components/ui/toast'
import { getPortalChart } from '@/modules/patients/data'
import { DocumentsList } from '@/modules/patients/components/clinical-chart'

export const metadata = { title: 'Documentos' }

export default async function MyDocumentsPage() {
  const { record } = await getPortalChart('documentos')

  return (
    <>
      <PageHeader title="Documentos" description="Recetas, reportes y consentimientos del expediente." />
      <DocumentsList
        documents={record.documents}
        action={() => (
          <NotifyButton message="Descargas disponibles próximamente" aria-label="Descargar" className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}>
            <Download />
          </NotifyButton>
        )}
      />
    </>
  )
}
