import type { Metadata } from 'next'

import { requireStaff } from '@/modules/auth/session'
import { StaffSidebar, StaffTabBar } from '../_components/staff-sidebar'

export const metadata: Metadata = {
  title: { default: 'Sistema', template: '%s · Sistema' },
  robots: { index: false, follow: false },
}

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff()
  const session = { name: user.name, role: user.role }

  return (
    <div className="min-h-dvh">
      <StaffSidebar user={session} />
      <StaffTabBar user={session} />
      <div className="md:pl-60 print:pl-0">
        <main className="mx-auto max-w-6xl px-5 pb-28 pt-8 sm:px-8 sm:pt-12 md:pb-16">{children}</main>
      </div>
    </div>
  )
}
