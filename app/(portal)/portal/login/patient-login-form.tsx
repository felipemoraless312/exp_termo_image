'use client'

import { useActionState, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { signInContact, signInPatient } from '@/modules/auth/actions'
import { cn } from '@/lib/utils'

type Mode = 'paciente' | 'contacto'

/** Un mismo acceso para el paciente y para sus contactos autorizados. */
export function PatientLoginForm() {
  const [mode, setMode] = useState<Mode>('paciente')

  return (
    <>
      <div role="tablist" aria-label="Tipo de acceso" className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
        {([['paciente', 'Soy paciente'], ['contacto', 'Soy contacto autorizado']] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={cn('h-9 rounded-full px-3 text-[13px] font-medium transition-colors', mode === key ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground')}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'paciente' ? <PatientForm /> : <ContactForm />}
    </>
  )
}

function PatientForm() {
  const [state, action, pending] = useActionState(signInPatient, undefined)

  return (
    <form action={action} className="space-y-4">
      <Field label="Número de expediente">
        <Input name="record" placeholder="EXP-000000" autoComplete="username" autoCapitalize="characters" required />
      </Field>
      <Field label="Fecha de nacimiento">
        <Input name="birthDate" type="date" autoComplete="bday" required />
      </Field>
      {state?.error && <p role="alert" className="text-[13px] text-danger">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? 'Verificando…' : 'Entrar'}</Button>
    </form>
  )
}

function ContactForm() {
  const [state, action, pending] = useActionState(signInContact, undefined)

  return (
    <form action={action} className="space-y-4">
      <Field label="Número de expediente del paciente">
        <Input name="record" placeholder="EXP-000000" autoCapitalize="characters" required />
      </Field>
      <Field label="Código de acceso" hint="El paciente te lo comparte al autorizarte.">
        <Input name="code" placeholder="XXXX-XXXX" autoComplete="one-time-code" autoCapitalize="characters" className="font-mono tracking-widest" required />
      </Field>
      {state?.error && <p role="alert" className="text-[13px] text-danger">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? 'Verificando…' : 'Entrar'}</Button>
    </form>
  )
}
