import Image from 'next/image'
import { redirect } from 'next/navigation'

import { platform } from '@/config/platform'
import { getPortalViewer, getStaffSession } from '@/modules/auth/session'
import { LoginTabs } from './login-tabs'

export const metadata = { title: { absolute: `Iniciar sesión · ${platform.name}` } }

/** Página principal: solo el inicio de sesión. Quien ya tiene sesión va directo a su apartado. */
export default async function LoginPage({ searchParams }: PageProps<'/'>) {
  const [staff, viewer, params] = await Promise.all([getStaffSession(), getPortalViewer(), searchParams])
  if (staff) redirect('/sistema')
  if (viewer) redirect('/portal')

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="animate-rise w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Image src={platform.logo} alt="Logotipo de la Universidad Politécnica de Chiapas" width={128} height={128} priority className="rounded-full" />
          <h1 className="mt-5 text-title-2">{platform.name}</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">{platform.fullName}</p>
        </div>
        <div className="mt-10 rounded-2xl bg-card p-5 shadow-card sm:p-6">
          <LoginTabs initial={params.acceso === 'medico' ? 'medico' : 'paciente'} />
        </div>
        <p className="mt-6 text-center text-[12px] leading-5 text-subtle">
          Tus datos personales y clínicos son confidenciales (NOM-004-SSA3-2012 y Ley Federal de Protección de Datos Personales).
        </p>
      </div>
    </main>
  )
}
