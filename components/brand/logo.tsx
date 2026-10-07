import Image from 'next/image'

import { platform } from '@/config/platform'
import { cn } from '@/lib/utils'

/** Logotipo de la Universidad Politécnica de Chiapas con su nombre (sistema, portal e inicio de sesión). */
export function PlatformLogo({ className, size = 36, caption = platform.fullName }: { className?: string; size?: number; caption?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image src={platform.logo} alt="" width={size} height={size} className="shrink-0 rounded-full" priority />
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">{platform.name}</span>
        {caption && <span className="mt-1 text-[11px] text-muted-foreground">{caption}</span>}
      </span>
    </span>
  )
}
