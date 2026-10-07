'use client'

import { useState } from 'react'

import { SegmentedControl } from './segmented-control'

/** Pestañas con segmented control. El contenido llega ya renderizado desde el servidor. */
export function Tabs({ label, items }: { label: string; items: { value: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(items[0]?.value ?? '')

  return (
    <div>
      <SegmentedControl label={label} options={items} value={active} onChange={setActive} className="max-w-full" />
      <div className="mt-6">
        {items.map((item) => <div key={item.value} hidden={item.value !== active}>{item.content}</div>)}
      </div>
    </div>
  )
}
