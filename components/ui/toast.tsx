'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert } from 'lucide-react'

type Tone = 'success' | 'error'
type Notify = (message: string, tone?: Tone) => void

const ToastContext = createContext<Notify>(() => {})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: Tone } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const notify = useCallback<Notify>((message, tone = 'success') => {
    clearTimeout(timer.current)
    setToast({ message, tone })
    timer.current = setTimeout(() => setToast(null), tone === 'error' ? 5000 : 2800)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[60] flex justify-center px-4 md:bottom-8">
        {toast && (
          <div className="material animate-rise flex max-w-md items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-medium shadow-float">
            {toast.tone === 'error'
              ? <CircleAlert size={17} className="shrink-0 text-danger" aria-hidden="true" />
              : <CheckCircle2 size={17} className="shrink-0 text-success" aria-hidden="true" />}
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

/** Botón que solo muestra un aviso; útil para acciones aún no conectadas al backend. */
export function NotifyButton({ message, ...props }: { message: string } & Omit<React.ComponentProps<'button'>, 'onClick' | 'type'>) {
  const notify = useToast()
  return <button type="button" onClick={() => notify(message)} {...props} />
}
