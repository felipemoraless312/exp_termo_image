'use client'

import { useState } from 'react'

import { cn } from '@/lib/utils'
import { PatientLoginForm } from './(portal)/portal/login/patient-login-form'
import { StaffLoginForm } from './(staff)/sistema/login/staff-login-form'

export type LoginTab = 'paciente' | 'medico'

/** Un solo inicio de sesión: pacientes (y sus contactos autorizados) o personal médico. */
export function LoginTabs({ initial = 'paciente' }: { initial?: LoginTab }) {
  const [tab, setTab] = useState<LoginTab>(initial)
  return (
    <>
      <div role="tablist" aria-label="Tipo de usuario" className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {([['paciente', 'Paciente'], ['medico', 'Personal médico']] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn('h-10 rounded-lg px-3 text-[14px] font-medium transition-colors', tab === key ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground')}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'paciente' ? <PatientLoginForm /> : <StaffLoginForm />}
    </>
  )
}
