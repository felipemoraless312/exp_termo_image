import { Pencil } from 'lucide-react'

import { ActionForm } from '@/components/ui/action-form'
import { Dialog } from '@/components/ui/dialog'
import { Field, FieldGrid, FormSection, Input, Select } from '@/components/ui/field'
import { educationLevels, emergencyRelationships, maritalStatuses, mexicanStates } from '@/modules/catalogs/clinical'
import { updateOwnInformation } from '@/modules/patients/portal-actions'
import type { Patient } from '@/modules/patients/types'

const options = (values: readonly string[]) => values.map((value) => <option key={value}>{value}</option>)

/** La paciente actualiza sus datos de contacto. La identidad (nombre, nacimiento, CURP) solo la corrige la clínica. */
export function EditInformationDialog({ patient }: { patient: Patient }) {
  const { address, emergencyContact: contact } = patient
  return (
    <Dialog title="Editar mis datos" description="Nombre, fecha de nacimiento y CURP solo pueden corregirse en la clínica." trigger={<><Pencil /> Editar mis datos</>} triggerStyle={{ variant: 'primary', size: 'md' }} wide>
      <ActionForm action={updateOwnInformation} className="space-y-8">
        <FormSection title="Contacto">
          <FieldGrid>
            <Field label="Teléfono celular"><Input name="phone" type="tel" inputMode="tel" required defaultValue={patient.phone} /></Field>
            <Field label="Correo electrónico"><Input name="email" type="email" defaultValue={patient.email} /></Field>
          </FieldGrid>
          <FieldGrid cols={3}>
            <Field label="Estado civil"><Select name="maritalStatus" defaultValue={patient.maritalStatus ?? ''}><option value="">Sin especificar</option>{options(maritalStatuses)}</Select></Field>
            <Field label="Escolaridad"><Select name="education" defaultValue={patient.education ?? ''}><option value="">Sin especificar</option>{options(educationLevels)}</Select></Field>
            <Field label="Ocupación"><Input name="occupation" defaultValue={patient.occupation} /></Field>
          </FieldGrid>
        </FormSection>

        <FormSection title="Domicilio">
          <Field label="Calle y número"><Input name="street" defaultValue={address.street} autoComplete="street-address" /></Field>
          <FieldGrid cols={4}>
            <Field label="Colonia" className="col-span-2 sm:col-span-1"><Input name="neighborhood" defaultValue={address.neighborhood} /></Field>
            <Field label="Municipio" className="col-span-2 sm:col-span-1"><Input name="municipality" defaultValue={address.municipality} /></Field>
            <Field label="Estado"><Select name="state" defaultValue={address.state || 'Chiapas'}>{options(mexicanStates)}</Select></Field>
            <Field label="C.P."><Input name="zip" inputMode="numeric" maxLength={5} defaultValue={address.zip} autoComplete="postal-code" /></Field>
          </FieldGrid>
        </FormSection>

        <FormSection title="Contacto de emergencia">
          <FieldGrid cols={3}>
            <Field label="Nombre completo"><Input name="emergencyName" defaultValue={contact.name} /></Field>
            <Field label="Parentesco"><Select name="emergencyRelationship" defaultValue={contact.relationship}><option value="">Sin especificar</option>{options(emergencyRelationships)}</Select></Field>
            <Field label="Teléfono"><Input name="emergencyPhone" type="tel" inputMode="tel" defaultValue={contact.phone} /></Field>
          </FieldGrid>
        </FormSection>
      </ActionForm>
    </Dialog>
  )
}
