import { ActionForm } from '@/components/ui/action-form'
import { Card } from '@/components/ui/card'
import { Field, FieldGrid, FormSection, Input, Select } from '@/components/ui/field'
import { bloodTypes, educationLevels, emergencyRelationships, insuranceTypes, maritalStatuses, mexicanStates, sexLabels, sexes } from '@/modules/catalogs/clinical'
import { todayISO } from '@/lib/format'
import { createPatient, updatePatient } from '../actions'
import { patientStatus, patientStatuses, type Patient } from '../types'

const options = (values: readonly string[]) => values.map((value) => <option key={value}>{value}</option>)

/** Ficha de identificación (NOM-004 y NOM-024): alta de expediente o corrección de datos. */
export function PatientForm({ patient }: { patient?: Patient }) {
  return (
    <Card className="p-5 sm:p-8">
      <ActionForm action={patient ? updatePatient : createPatient} submitLabel={patient ? 'Guardar cambios' : 'Abrir expediente'} className="space-y-10">
        {patient && <input type="hidden" name="patientId" value={patient.id} />}

        <FormSection title="Identificación">
          <FieldGrid cols={3}>
            <Field label="Nombre(s)"><Input name="firstName" required autoComplete="off" defaultValue={patient?.firstName} /></Field>
            <Field label="Primer apellido"><Input name="lastName" required autoComplete="off" defaultValue={patient?.lastName} /></Field>
            <Field label="Segundo apellido"><Input name="secondLastName" autoComplete="off" defaultValue={patient?.secondLastName} /></Field>
          </FieldGrid>
          <FieldGrid cols={3}>
            <Field label="CURP" hint="18 caracteres; identifica de forma única al paciente."><Input name="curp" maxLength={18} className="uppercase" autoComplete="off" defaultValue={patient?.curp} /></Field>
            <Field label="Fecha de nacimiento"><Input name="birthDate" type="date" max={todayISO()} required defaultValue={patient?.birthDate} /></Field>
            <Field label="Sexo"><Select name="sex" required defaultValue={patient?.sex ?? ''}>{[<option key="" value="" disabled>Selecciona</option>, ...sexes.map((s) => <option key={s} value={s}>{sexLabels[s]}</option>)]}</Select></Field>
            <Field label="Lugar de nacimiento"><Input name="birthPlace" defaultValue={patient?.birthPlace} /></Field>
            <Field label="Estado civil"><Select name="maritalStatus" defaultValue={patient?.maritalStatus ?? ''}><option value="">Sin especificar</option>{options(maritalStatuses)}</Select></Field>
            <Field label="Grupo sanguíneo y Rh"><Select name="bloodType" defaultValue={patient?.bloodType ?? 'Desconocido'}>{options(bloodTypes)}</Select></Field>
            <Field label="Escolaridad"><Select name="education" defaultValue={patient?.education ?? ''}><option value="">Sin especificar</option>{options(educationLevels)}</Select></Field>
            <Field label="Ocupación"><Input name="occupation" defaultValue={patient?.occupation} /></Field>
            <Field label="Religión" hint="Opcional; relevante si condiciona tratamientos."><Input name="religion" defaultValue={patient?.religion} /></Field>
            <Field label="Lengua indígena que habla" hint="Opcional (catálogo NOM-024)."><Input name="indigenousLanguage" defaultValue={patient?.indigenousLanguage} /></Field>
            {patient && (
              <Field label="Estado del expediente">
                <Select name="status" defaultValue={patient.status}>{patientStatuses.map((s) => <option key={s} value={s}>{patientStatus[s].label}</option>)}</Select>
              </Field>
            )}
          </FieldGrid>
        </FormSection>

        <FormSection title="Contacto y domicilio" description="El domicilio puede completarse después; queda marcado como pendiente en el expediente.">
          <FieldGrid>
            <Field label="Teléfono"><Input name="phone" type="tel" inputMode="tel" required defaultValue={patient?.phone} /></Field>
            <Field label="Correo electrónico"><Input name="email" type="email" defaultValue={patient?.email} /></Field>
          </FieldGrid>
          <Field label="Calle y número"><Input name="street" defaultValue={patient?.address.street} /></Field>
          <FieldGrid cols={4}>
            <Field label="Colonia" className="col-span-2 sm:col-span-1"><Input name="neighborhood" defaultValue={patient?.address.neighborhood} /></Field>
            <Field label="Municipio o alcaldía" className="col-span-2 sm:col-span-1"><Input name="municipality" defaultValue={patient?.address.municipality} /></Field>
            <Field label="Estado"><Select name="state" defaultValue={patient?.address.state ?? 'Chiapas'}>{options(mexicanStates)}</Select></Field>
            <Field label="C.P."><Input name="zip" inputMode="numeric" maxLength={5} defaultValue={patient?.address.zip} /></Field>
          </FieldGrid>
        </FormSection>

        <FormSection title="Afiliación">
          <FieldGrid>
            <Field label="Institución o tipo de pago"><Select name="insuranceType" defaultValue={patient ? patient.insurance.type : 'Particular'}><option value="">Sin registrar</option>{options(insuranceTypes)}</Select></Field>
            <Field label="Número de afiliación o póliza"><Input name="insurancePolicy" defaultValue={patient?.insurance.policy} /></Field>
          </FieldGrid>
        </FormSection>

        <FormSection title="Contacto de emergencia">
          <FieldGrid cols={3}>
            <Field label="Nombre completo"><Input name="emergencyName" defaultValue={patient?.emergencyContact.name} /></Field>
            <Field label="Parentesco"><Select name="emergencyRelationship" defaultValue={patient?.emergencyContact.relationship ?? ''}>{[<option key="" value="">Sin especificar</option>, ...emergencyRelationships.map((r) => <option key={r}>{r}</option>)]}</Select></Field>
            <Field label="Teléfono"><Input name="emergencyPhone" type="tel" inputMode="tel" defaultValue={patient?.emergencyContact.phone} /></Field>
          </FieldGrid>
        </FormSection>

        <p className="text-[13px] leading-5 text-subtle">
          Los datos personales y clínicos son confidenciales (NOM-004-SSA3-2012 y Ley Federal de Protección de Datos Personales). El aviso de privacidad debe entregarse al paciente al abrir su expediente.
        </p>
      </ActionForm>
    </Card>
  )
}
