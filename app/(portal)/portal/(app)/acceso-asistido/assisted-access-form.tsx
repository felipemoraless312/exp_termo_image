'use client'

import { useActionState, useState } from 'react'
import { Check, Copy, KeyRound, ShieldCheck, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, Field, Input, Select } from '@/components/ui/field'
import { grantAccess } from '@/modules/access/actions'
import { accessScopeKeys, accessScopes, relationships } from '@/modules/access/types'

/** Autoriza a un contacto y muestra su código de acceso una sola vez. */
export function AssistedAccessForm({ record }: { record: string }) {
  const [state, action, pending] = useActionState(grantAccess, undefined)
  const [copied, setCopied] = useState(false)
  // Código ya visto: al pulsar "Autorizar a otra persona" se vuelve a mostrar el formulario vacío.
  const [dismissed, setDismissed] = useState<string>()

  if (state?.ok && state.code && state.code !== dismissed) {
    return (
      <Card className="animate-rise p-7 sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success"><Check size={24} /></span>
        <h2 className="mt-4 text-title-3">Acceso autorizado para {state.contactName}</h2>
        <p className="mt-2 text-muted-foreground">Comparte estos datos con tu contacto. Entrará en el portal con la opción “Soy contacto autorizado”.</p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-muted p-4">
            <dt className="text-[13px] text-muted-foreground">Número de expediente</dt>
            <dd className="mt-1 font-mono text-[20px] font-semibold tracking-wide">{record}</dd>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><KeyRound size={14} aria-hidden="true" /> Código de acceso</dt>
            <dd className="mt-1 flex items-center justify-between gap-2 font-mono text-[20px] font-semibold tracking-widest">
              {state.code}
              <button
                type="button"
                aria-label="Copiar código"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
                onClick={() => { void navigator.clipboard?.writeText(state.code!); setCopied(true) }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </dd>
          </div>
        </dl>

        <p className="mt-5 flex gap-2.5 rounded-xl bg-warning-soft px-4 py-3 text-[14px] leading-5 text-warning">
          <TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          Por seguridad, el código no se volverá a mostrar. Si se pierde, revoca este acceso y crea uno nuevo.
        </p>
        <Button type="button" variant="secondary" className="mt-6" onClick={() => { setCopied(false); setDismissed(state.code) }}>Autorizar a otra persona</Button>
      </Card>
    )
  }

  return (
    <Card className="p-6 sm:p-7">
      <p className="flex gap-3 rounded-xl bg-muted p-4 text-[14px] leading-6 text-muted-foreground">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        Tu contacto podrá consultar tu información (sin modificarla) con tu número de expediente y un código personal. Puedes revocar el acceso en cualquier momento.
      </p>
      <form action={action} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo del contacto" className="sm:col-span-2"><Input name="name" required maxLength={120} /></Field>
        <Field label="Parentesco">
          <Select name="relationship" required defaultValue="">
            <option value="" disabled>Selecciona</option>
            {relationships.map((option) => <option key={option}>{option}</option>)}
          </Select>
        </Field>
        <Field label="Teléfono"><Input name="phone" type="tel" required maxLength={20} /></Field>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-[13px] font-medium">Nivel de acceso</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {accessScopeKeys.map((scope) => (
              <label key={scope} className="flex cursor-pointer gap-3 rounded-xl border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-accent/50">
                <input type="radio" name="scope" value={scope} defaultChecked={scope === 'emergencia'} className="mt-1 accent-[var(--primary)]" />
                <span>
                  <span className="block text-[14px] font-medium">{accessScopes[scope].label}</span>
                  <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{accessScopes[scope].description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="sm:col-span-2">
          <Checkbox name="consent" required label="Autorizo que esta persona consulte mi información clínica según el nivel elegido." />
        </div>
        {state && !state.ok && (
          <p role="alert" className="flex gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-[14px] leading-5 text-danger sm:col-span-2">
            <TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />{state.error}
          </p>
        )}
        <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? 'Autorizando…' : 'Autorizar acceso'}</Button></div>
      </form>
    </Card>
  )
}
