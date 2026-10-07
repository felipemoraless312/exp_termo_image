import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { requireStaff } from '@/modules/auth/session'
import { PatientForm } from '@/modules/patients/components/patient-form'

export const metadata = { title: 'Nuevo paciente' }

export default async function NewPatientPage() {
  await requireStaff('patients.write')

  return (
    <>
      <Link href="/sistema/pacientes" className="-ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> Pacientes
      </Link>
      <PageHeader title="Nuevo paciente" description="Se asignará un número de expediente único que no cambiará durante toda la relación con la clínica." />
      <PatientForm />
    </>
  )
}
