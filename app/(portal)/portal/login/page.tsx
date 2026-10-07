import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthShell } from '@/components/layout/auth-shell'
import { getPortalViewer } from '@/modules/auth/session'
import { PatientLoginForm } from './patient-login-form'

export const metadata: Metadata = { title: 'Portal del paciente' }

export default async function PatientLoginPage() {
  if (await getPortalViewer()) redirect('/portal')

  return (
    <AuthShell
      caption="Portal del paciente"
      title="Tu expediente, contigo."
      description="Consulta tu expediente clínico de forma segura, o el de un familiar que te haya autorizado."
      footer={
        <div className="space-y-1.5">
          <p>Demo paciente: <b className="font-medium">EXP-000123</b> · nacimiento <b className="font-medium">15/04/1981</b></p>
          <p>Demo contacto: <b className="font-medium">EXP-000123</b> · código <b className="font-medium">ELNA-2026</b></p>
          <p className="pt-2"><Link href="/sistema/login" className="text-accent-foreground hover:underline">¿Eres médico? Acceso médico</Link></p>
        </div>
      }
    >
      <PatientLoginForm />
    </AuthShell>
  )
}
