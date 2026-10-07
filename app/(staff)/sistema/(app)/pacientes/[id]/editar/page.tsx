import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { PageHeader } from '@/components/ui/page-header'
import { requireStaff } from '@/modules/auth/session'
import { PatientForm } from '@/modules/patients/components/patient-form'
import { getPatient } from '@/modules/patients/data'

export const metadata = { title: 'Editar ficha de identificación' }

export default async function EditPatientPage({ params }: PageProps<'/sistema/pacientes/[id]/editar'>) {
  await requireStaff('patients.write')
  const { id } = await params
  const patient = await getPatient(id)
  if (!patient) notFound()

  return (
    <>
      <Link href={`/sistema/pacientes/${id}?seccion=historia`} className="-ml-1 mb-6 inline-flex items-center gap-0.5 text-[14px] text-accent-foreground hover:underline">
        <ChevronLeft size={17} aria-hidden="true" /> {patient.name}
      </Link>
      <PageHeader eyebrow={patient.record} title="Ficha de identificación" description="El número de expediente no se modifica. Los cambios quedan registrados en la bitácora." />
      <PatientForm patient={patient} />
    </>
  )
}
