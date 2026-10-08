import Image from 'next/image'

import { cn } from '@/lib/utils'

export function Avatar({ src, name, size = 40, className }: { src?: string; name: string; size?: number; className?: string }) {
  // Sin títulos ("Dr. Francisco Gutiérrez" → FG, no DF).
  const initials = name.split(' ').filter((part) => part && !/^(dra?|lic|enf|mtr[oa]|ing)\.?$/i.test(part)).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const shape = cn('shrink-0 rounded-full', className)

  if (src) return <Image src={src} alt="" width={size} height={size} className={cn(shape, 'object-cover')} style={{ width: size, height: size }} />

  return (
    <span aria-hidden="true" className={cn(shape, 'flex items-center justify-center bg-muted font-medium text-muted-foreground')} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </span>
  )
}
