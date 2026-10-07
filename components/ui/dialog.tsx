'use client'

import { createContext, useContext, useRef, useState } from 'react'
import { X } from 'lucide-react'

import { buttonVariants } from './button'
import { cn } from '@/lib/utils'

const DialogContext = createContext<{ close: () => void } | null>(null)

/** Permite a un formulario dentro del diálogo cerrarlo al guardar. */
export const useDialog = () => useContext(DialogContext)

type ButtonStyle = Parameters<typeof buttonVariants>[0]

/**
 * Diálogo modal nativo (`<dialog>`): hoja inferior en celular, ventana centrada en escritorio.
 * El contenido se monta solo al abrir, así cada apertura empieza con el formulario limpio.
 */
export function Dialog({ trigger, triggerLabel, triggerStyle, triggerClassName, bareTrigger = false, title, description, wide = false, children }: {
  trigger: React.ReactNode
  /** Etiqueta accesible si el disparador solo muestra un ícono. */
  triggerLabel?: string
  triggerStyle?: ButtonStyle
  triggerClassName?: string
  /** El disparador no lleva estilo de botón (p. ej. un bloque del calendario). */
  bareTrigger?: boolean
  title: string
  description?: React.ReactNode
  wide?: boolean
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const close = () => ref.current?.close()

  return (
    <>
      <button
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        className={bareTrigger ? triggerClassName : cn(buttonVariants(triggerStyle ?? { variant: 'secondary', size: 'sm' }), triggerClassName)}
        onClick={() => {
          setOpen(true)
          ref.current?.showModal()
        }}
      >
        {trigger}
      </button>
      <dialog
        ref={ref}
        aria-label={title}
        className={cn('sheet', wide && 'sheet-wide')}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close() // clic en el fondo
        }}
      >
        {open && (
          <DialogContext.Provider value={{ close }}>
            <div className="flex max-h-[inherit] flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-separator px-5 pb-4 pt-5 sm:px-6">
                <div className="min-w-0">
                  <h2 className="text-title-3">{title}</h2>
                  {description && <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{description}</p>}
                </div>
                <button type="button" onClick={close} aria-label="Cerrar" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5 sm:px-6">{children}</div>
            </div>
          </DialogContext.Provider>
        )}
      </dialog>
    </>
  )
}
