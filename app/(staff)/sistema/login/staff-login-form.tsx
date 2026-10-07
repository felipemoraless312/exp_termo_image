'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { signInStaff } from '@/modules/auth/actions'

export function StaffLoginForm() {
  const [state, action, pending] = useActionState(signInStaff, undefined)

  return (
    <form action={action} className="space-y-4">
      <Field label="Correo">
        <Input name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Contraseña">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state?.error && <p role="alert" className="text-[13px] text-danger">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? 'Entrando…' : 'Iniciar sesión'}</Button>
    </form>
  )
}
