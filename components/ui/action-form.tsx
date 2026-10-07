'use client'

import { useRef, useState, useTransition } from 'react'
import { TriangleAlert } from 'lucide-react'

import { Button, buttonVariants } from './button'
import { useDialog } from './dialog'
import { useToast } from './toast'
import type { ActionState } from '@/lib/action-state'
import { cn } from '@/lib/utils'

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>

/**
 * Formulario conectado a una Server Action con validación del servidor.
 * Muestra el error sin borrar lo capturado, pide confirmación cuando la acción lo solicita
 * (p. ej. alerta de alergia) y, al guardar, avisa con un toast y cierra el diálogo que lo contiene.
 */
export function ActionForm({ action, children, submitLabel = 'Guardar', pendingLabel = 'Guardando…', submitStyle, className, cancel = true }: {
  action: Action
  children?: React.ReactNode
  submitLabel?: React.ReactNode
  pendingLabel?: string
  submitStyle?: Parameters<typeof buttonVariants>[0]
  className?: string
  cancel?: boolean
}) {
  const [state, setState] = useState<ActionState>()
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const notify = useToast()
  const dialog = useDialog()

  return (
    <form
      ref={formRef}
      className={cn('space-y-4', className)}
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        startTransition(async () => {
          const result = await action(state, data)
          setState(result)
          if (result?.ok) {
            notify(result.message ?? 'Cambios guardados')
            formRef.current?.reset()
            dialog?.close()
          }
        })
      }}
    >
      {children}

      {state && !state.ok && (
        <div role="alert" className="flex gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-[14px] leading-5 text-danger">
          <TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}
      {state && !state.ok && state.confirm && (
        <label className="flex items-start gap-3 rounded-xl border border-danger/30 px-4 py-3 text-[14px]">
          <input type="checkbox" name="confirm" required className="mt-0.5 size-4 accent-[var(--danger)]" />
          {state.confirm}
        </label>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {cancel && dialog && <Button type="button" variant="ghost" onClick={dialog.close}>Cancelar</Button>}
        <Button type="submit" disabled={pending} variant={submitStyle?.variant} size={submitStyle?.size}>{pending ? pendingLabel : submitLabel}</Button>
      </div>
    </form>
  )
}

/** Botón de una sola acción (p. ej. "Surtir", "Marcar llegada"), sin campos visibles. */
export function ActionButton({ action, fields, children, style, className, confirmText }: {
  action: Action
  fields: Record<string, string>
  children: React.ReactNode
  style?: Parameters<typeof buttonVariants>[0]
  className?: string
  /** Pregunta de confirmación nativa antes de ejecutar acciones irreversibles. */
  confirmText?: string
}) {
  const [pending, startTransition] = useTransition()
  const notify = useToast()
  const dialog = useDialog()

  return (
    <button
      type="button"
      disabled={pending}
      className={cn(buttonVariants(style ?? { variant: 'secondary', size: 'sm' }), className)}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return
        const data = new FormData()
        for (const [key, value] of Object.entries(fields)) data.set(key, value)
        startTransition(async () => {
          const result = await action(undefined, data)
          if (result?.ok) {
            notify(result.message ?? 'Listo')
            dialog?.close()
          }
          else notify(result?.error ?? 'No se pudo completar', 'error')
        })
      }}
    >
      {children}
    </button>
  )
}
