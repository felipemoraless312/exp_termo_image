import { UserCheck } from 'lucide-react'

import { ActionButton } from '@/components/ui/action-form'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { List, ListItem } from '@/components/ui/list'
import { PageHeader, SectionTitle } from '@/components/ui/page-header'
import { revokeAccess } from '@/modules/access/actions'
import { listMyContacts } from '@/modules/access/data'
import { accessScopes } from '@/modules/access/types'
import { requirePatient } from '@/modules/auth/session'
import { formatDate, formatDateTime } from '@/lib/format'
import { AssistedAccessForm } from './assisted-access-form'

export const metadata = { title: 'Acceso asistido' }

export default async function AssistedAccessPage() {
  const patient = await requirePatient()
  const contacts = await listMyContacts()
  const active = contacts.filter((c) => !c.revokedAt)
  const revoked = contacts.filter((c) => c.revokedAt)

  return (
    <>
      <PageHeader title="Acceso asistido" description="Autoriza a un familiar o contacto de confianza (por ejemplo, tu contacto de emergencia) para consultar tu información." />

      <SectionTitle>Contactos con acceso</SectionTitle>
      <Card className="py-1.5">
        {active.length ? (
          <List>
            {active.map((c) => (
              <ListItem
                key={c.id}
                leading={<UserCheck size={18} className="text-muted-foreground" aria-hidden="true" />}
                title={`${c.name} · ${c.relationship}`}
                description={`${accessScopes[c.scope].label} · desde ${formatDate(c.createdAt, 'medium')}${c.lastAccessAt ? ` · último acceso ${formatDateTime(c.lastAccessAt)}` : ' · aún no ha entrado'}`}
                trailing={
                  <ActionButton action={revokeAccess} fields={{ contactId: c.id }} style={{ variant: 'ghost', size: 'sm' }} className="text-danger" confirmText={`¿Revocar el acceso de ${c.name}? Dejará de ver tu información de inmediato.`}>
                    Revocar
                  </ActionButton>
                }
              />
            ))}
          </List>
        ) : <p className="px-6 py-5 text-[14px] text-muted-foreground">Nadie más tiene acceso a tu expediente.</p>}
      </Card>

      <SectionTitle>Autorizar a un contacto</SectionTitle>
      <AssistedAccessForm record={patient.record} />

      {revoked.length > 0 && (
        <>
          <SectionTitle>Accesos revocados</SectionTitle>
          <Card className="py-1.5">
            <List>
              {revoked.map((c) => (
                <ListItem key={c.id} title={`${c.name} · ${c.relationship}`} description={`Revocado ${formatDate(c.revokedAt!, 'medium')}`} trailing={<Badge>Revocado</Badge>} />
              ))}
            </List>
          </Card>
        </>
      )}
    </>
  )
}
