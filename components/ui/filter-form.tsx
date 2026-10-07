'use client'

import Form from 'next/form'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Barra de búsqueda y filtros que actualiza los parámetros de la URL.
 * Los `<select>` aplican el filtro al cambiar; la búsqueda, al pulsar Enter.
 */
export function FilterForm({ action, query, placeholder = 'Buscar', children, className }: {
  action: string
  query?: string
  placeholder?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <Form
      action={action}
      scroll={false}
      className={cn('mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center', className)}
      onChange={(event) => {
        if (event.target instanceof HTMLSelectElement) event.currentTarget.requestSubmit()
      }}
    >
      <div role="search" className="relative min-w-0 flex-1 sm:min-w-64">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" aria-hidden="true" />
        <input
          name="q"
          defaultValue={query}
          type="search"
          enterKeyHint="search"
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 w-full rounded-xl bg-card pl-11 pr-4 text-[15px] shadow-card placeholder:text-subtle focus:outline-none focus:ring-4 focus:ring-ring/25"
        />
      </div>
      {children && <div className="grid grid-cols-2 gap-2 sm:flex">{children}</div>}
    </Form>
  )
}

export function FilterSelect({ name, value, label, options }: { name: string; value?: string; label: string; options: readonly { value: string; label: string }[] }) {
  return (
    <select
      name={name}
      defaultValue={value ?? ''}
      aria-label={label}
      className="h-11 min-w-0 appearance-none rounded-xl bg-card bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20fill=%22none%22%20stroke=%22%2386868b%22%20stroke-width=%221.6%22%3E%3Cpath%20d=%22m3%204.5%203%203%203-3%22/%3E%3C/svg%3E')] bg-[position:right_0.8rem_center] bg-no-repeat pl-3.5 pr-8 text-[14px] shadow-card focus:outline-none focus:ring-4 focus:ring-ring/25"
    >
      <option value="">{label}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  )
}
