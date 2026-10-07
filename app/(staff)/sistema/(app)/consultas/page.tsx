import { FileText } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { List, ListItem } from '@/components/ui/list'
import { PageHeader } from '@/components/ui/page-header'
import { listRecentNotes } from '@/modules/patients/data'
import { noteTemplates } from '@/modules/patients/note-templates'
import { formatDateTime } from '@/lib/format'

export const metadata = { title: 'Notas clínicas' }

export default async function ConsultationsPage() {
  const notes = await listRecentNotes(40)

  return (
    <>
      <PageHeader title="Notas clínicas" description="Últimas notas firmadas en todos los expedientes." />
      <Card className="py-1.5">
        {notes.length ? (
          <List>
            {notes.map((note) => (
              <ListItem
                key={note.id}
                href={`/sistema/pacientes/${note.patient.id}/notas/${note.id}`}
                leading={<Avatar src={note.patient.photo} name={note.patient.name} size={40} />}
                title={note.patient.name}
                description={`${formatDateTime(note.createdAt)} · ${note.author}${note.diagnoses[0] ? ` · ${note.diagnoses[0].code ?? ''} ${note.diagnoses[0].description}` : ''}`}
                trailing={<Badge className="hidden sm:inline-flex">{noteTemplates[note.type].label}</Badge>}
              />
            ))}
          </List>
        ) : <EmptyState icon={FileText} title="Sin notas registradas" />}
      </Card>
    </>
  )
}
