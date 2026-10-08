import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import { requireStaff } from '@/modules/auth/session'
import { SIDEBAR_COOKIE, StaffSidebar, StaffTabBar } from '../_components/staff-sidebar'

export const metadata: Metadata = {
  title: { default: 'Sistema', template: '%s · Sistema' },
  robots: { index: false, follow: false },
}

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff()
  const session = { name: user.name, role: user.role }
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === 'collapsed'

  return (
    <div id="staff-shell" data-sidebar={collapsed ? 'collapsed' : 'expanded'} className="group/shell min-h-dvh">
      <StaffSidebar user={session} initialCollapsed={collapsed} />
      <StaffTabBar user={session} />
      <div className="transition-[padding] duration-200 md:pl-60 md:group-data-[sidebar=collapsed]/shell:pl-16 print:pl-0">
        <main className="mx-auto max-w-6xl px-5 pb-28 pt-8 sm:px-8 sm:pt-12 md:pb-16 md:group-data-[sidebar=collapsed]/shell:max-w-7xl print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  )
}
