import Link from 'next/link'
import { ShieldAlert, UserPlus, Users } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FilterForm, FilterSelect } from '@/components/ui/filter-form'
import { List, ListItem } from '@/components/ui/list'
import { PageHeader } from '@/components/ui/page-header'
import { canAccess } from '@/modules/auth/permissions'
import { requireStaff } from '@/modules/auth/session'
import { listPatients } from '@/modules/patients/data'
import { patientStatus, patientStatuses, type PatientStatus } from '@/modules/patients/types'
import { ageFrom } from '@/lib/format'

export const metadata = { title: 'Pacientes' }

export default async function PatientsPage({ searchParams }: PageProps<'/sistema/pacientes'>) {
  const user = await requireStaff('patients')
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q : ''
  const status = patientStatuses.find((s) => s === params.estado) as PatientStatus | undefined
  const patients = (await listPatients(query)).filter((p) => !status || p.status === status)
  const canOpen = canAccess(user.role, 'record')

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Busca por nombre, expediente, CURP o teléfono."
        actions={canAccess(user.role, 'patients.write') && <Link href="/sistema/pacientes/nuevo" className={buttonVariants()}><UserPlus /> Nuevo paciente</Link>}
      />

      <FilterForm action="/sistema/pacientes" query={query} placeholder="Buscar paciente">
        <FilterSelect name="estado" value={status} label="Todos los estados" options={patientStatuses.map((s) => ({ value: s, label: patientStatus[s].label }))} />
      </FilterForm>

      <Card className="py-1.5">
        {patients.length ? (
          <List>
            {patients.map((patient) => (
              <ListItem
                key={patient.id}
                href={canOpen ? `/sistema/pacientes/${patient.id}` : undefined}
                leading={<Avatar src={patient.photo} name={patient.name} size={40} />}
                title={patient.name}
                description={`${patient.record} · ${ageFrom(patient.birthDate)} años · ${patient.phone}`}
                trailing={
                  <span className="flex items-center gap-2">
                    {canOpen && patient.allergies.length > 0 && <Badge tone="danger"><ShieldAlert size={12} aria-hidden="true" />Alergias</Badge>}
                    <Badge tone={patientStatus[patient.status].tone} className="hidden sm:inline-flex">{patientStatus[patient.status].label}</Badge>
                  </span>
                }
              />
            ))}
          </List>
        ) : (
          <EmptyState icon={Users} title={query ? `Sin resultados para “${query}”` : 'Sin pacientes'} description="Verifica la búsqueda o abre un expediente nuevo." />
        )}
      </Card>
      <p className="mt-4 px-1 text-[13px] text-subtle">{patients.length} expediente(s)</p>
    </>
  )
}
