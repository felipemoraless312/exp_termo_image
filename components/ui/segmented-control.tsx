'use client'

import { cn } from '@/lib/utils'

export function SegmentedControl<T extends string>({ options, value, onChange, label, className }: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-muted p-1', className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-8 shrink-0 rounded-full px-4 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-200',
              selected ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
