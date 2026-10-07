import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AuthShell } from '@/components/layout/auth-shell'
import { getStaffSession } from '@/modules/auth/session'
import { StaffLoginForm } from './staff-login-form'

export const metadata: Metadata = { title: 'Acceso médico' }

export default async function StaffLoginPage() {
  if (await getStaffSession()) redirect('/sistema')

  return (
    <AuthShell
      caption="Expediente clínico"
      title="Acceso médico"
      description="Consulta y actualiza el expediente clínico de tus pacientes."
      footer={<>Demo: <b className="font-medium">francisco.ramos@medora.mx</b> · contraseña <b className="font-medium">medico2026</b></>}
    >
      <StaffLoginForm />
    </AuthShell>
  )
}
