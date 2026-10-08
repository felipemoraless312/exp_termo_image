import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { PrintButton } from '@/components/ui/print-button'
import { canAccess } from '@/modules/auth/permissions'
import { requireStaff } from '@/modules/auth/session'
import { ThermographyReportSettings, ThermographyReportSheet } from '@/modules/oncology/components/thermography-report'
import { getThermographyReport } from '@/modules/oncology/report'

export const metadata = { title: 'Informe de termografía' }

/** Informe "Mastografía térmica digital" listo para imprimir o guardar como PDF (A4 horizontal). */
export default async function ThermographyReportPage({ params }: PageProps<'/sistema/pacientes/[id]/termografia/[thermographyId]/informe'>) {
  const [{ id, thermographyId }, user] = await Promise.all([params, requireStaff('oncology')])
  const view = await getThermographyReport(id, thermographyId)
  if (!view) notFound()

  return (
    <>
      <style>{'@page { size: A4 landscape; margin: 10mm; }'}</style>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/sistema/pacientes/${id}?seccion=oncologia`} className="-ml-1 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
          <ChevronLeft size={17} aria-hidden="true" /> {view.patient.name} · {view.thermography.folio}
        </Link>
        <PrintButton label="Imprimir o guardar PDF" />
      </div>
      <div className="-mx-1 overflow-x-auto px-1 pb-2 print:m-0 print:overflow-visible print:p-0">
        <ThermographyReportSheet view={view} />
      </div>
      {canAccess(user.role, 'oncology.write') && <div className="mt-6"><ThermographyReportSettings view={view} /></div>}
    </>
  )
}
