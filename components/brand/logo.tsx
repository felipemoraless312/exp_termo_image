import { platform } from '@/config/platform'
import { cn } from '@/lib/utils'

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('size-7', className)}>
      <rect width="24" height="24" rx="7" className="fill-primary" />
      {/* Expediente: hoja con esquina doblada y un trazo de pulso. */}
      <path d="M7.5 5.5h6l3 3v10h-9z" fill="none" stroke="white" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 13.5h1.6l1-2 1.6 4 1-2H15" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Logotipo de la plataforma (sitio, portal y sistema del médico). */
export function PlatformLogo({ className, caption }: { className?: string; caption?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Mark />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">{platform.name}</span>
        {caption && <span className="mt-1 text-[11px] text-muted-foreground">{caption}</span>}
      </span>
    </span>
  )
}
