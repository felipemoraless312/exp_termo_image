import { ActionForm } from '@/components/ui/action-form'
import { Card } from '@/components/ui/card'
import { Field, FieldGrid, Input, Select, Textarea } from '@/components/ui/field'
import { REPORT_MAX_IMAGES, thermographyReport as R } from '@/config/report'
import { AnnotatedImage } from '@/modules/files/components/annotation-layer'
import { saveThermographyReport } from '../actions'
import { diagnosisLine, type ThermographyReportView } from '../report'

const dmy = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/')

/** Hoja A4 horizontal con el formato de la clínica ("Mastografía térmica digital"). Se imprime tal cual. */
export function ThermographyReportSheet({ view }: { view: ThermographyReportView }) {
  const { patient, thermography, report, doctor } = view
  const images = report.imageIds.map((id) => view.candidates.find((c) => c.id === id)).filter((c) => c !== undefined)
  return (
    <article className="report-sheet mx-auto flex h-[186mm] w-[277mm] break-inside-avoid flex-col overflow-hidden bg-white text-[3.4mm] leading-snug text-black shadow-lg print:shadow-none">
      <header className="flex items-center gap-[6mm] px-[8mm] pt-[4mm]">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo estático; se imprime sin optimizador */}
        <img src={R.logo} alt="CEPREC" className="h-[24mm] w-auto" />
        {/* Una sola línea y letra estrecha, como el encabezado original (escala horizontal: funciona con cualquier fuente). */}
        <p className="origin-left scale-x-[0.78] whitespace-nowrap text-[9mm] font-extrabold uppercase leading-none tracking-tight text-[#1a8cff]">{R.organization}</p>
      </header>
      <h1 className="mt-[1mm] text-center text-[6.5mm] font-normal uppercase tracking-wide">{R.title}</h1>

      <div className="mt-[3mm] px-[8mm]">
        <p className="text-[4.4mm] font-bold">Nombre: {patient.name.toUpperCase()}</p>
        <p className="text-[3.6mm] font-bold">Fecha de nacimiento: {dmy(patient.birthDate)} · Fecha de estudio: {dmy(report.studyDate)}</p>
      </div>

      <div className="mt-[3mm] flex h-[62mm] gap-[1.5mm] px-[8mm]">
        {images.length ? images.map((image) => (
          <div key={image.id} className="relative h-full min-w-0 max-w-[66mm] overflow-hidden">
            <AnnotatedImage fileId={image.id} alt={image.name} annotation={view.annotations[image.id]} className="h-full w-auto max-w-full object-cover" />
          </div>
        )) : <p className="flex flex-1 items-center justify-center border border-dashed border-neutral-400 text-neutral-500">Sin imágenes seleccionadas</p>}
      </div>

      <div className="mt-[4mm] px-[8mm]">
        <p className="text-[4mm] font-bold">Diagnóstico: {diagnosisLine(report.diagnosis, thermography.grade)}</p>
        <div className="mt-[3mm] flex items-end gap-[8mm]">
          <div>
            <p className="text-[4.2mm] font-bold">{doctor.name}.{doctor.specialty ? ` ${doctor.specialty}.` : ''}</p>
            <p className="text-[4.2mm] font-bold">{R.clinic}</p>
          </div>
          <div className="w-[60mm] border-b border-black pb-[1mm] text-center text-[2.8mm] text-neutral-500">Firma</div>
        </div>
      </div>

      <footer className="mt-auto space-y-[1mm] px-[8mm] pb-[5mm] text-justify text-[2.75mm] font-semibold italic leading-tight">
        <p>Clasificación: {R.classification.map(([grade, label]) => `${grade}: ${label}`).join('; ')}.</p>
        <p>{R.disclaimer}</p>
        <p>Referencias: {R.references} {R.contact.address}. Teléfono/Fax {R.contact.phone}. Internet: {R.contact.web}. Correo: {R.contact.email}</p>
      </footer>
    </article>
  )
}

/** Ajustes del informe (no se imprimen). `key` lo vuelve a montar al guardar para mostrar los valores nuevos. */
export function ThermographyReportSettings({ view }: { view: ThermographyReportView }) {
  const { patient, thermography, report, candidates } = view
  return (
    <Card className="no-print p-5 sm:p-6">
      <h2 className="text-title-3">Ajustar informe</h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {view.saved ? 'Valores guardados.' : 'Valores automáticos: las primeras imágenes térmicas, los hallazgos de la termografía y la fecha de la campaña.'} Puede cambiarlos y guardar.
      </p>
      <ActionForm key={report.recorded?.at ?? 'auto'} action={saveThermographyReport} submitLabel="Guardar ajustes" cancel={false} className="mt-4">
        <input type="hidden" name="patientId" value={patient.id} />
        <input type="hidden" name="thermographyId" value={thermography.id} />
        <FieldGrid>
          <Field label="Diagnóstico" hint={`La clasificación ${thermography.grade} se agrega al final si no la escribe.`}>
            <Textarea name="diagnosis" defaultValue={report.diagnosis} maxLength={300} required className="min-h-20" />
          </Field>
          <Field label="Fecha del estudio"><Input name="studyDate" type="date" defaultValue={report.studyDate} required /></Field>
        </FieldGrid>
        {candidates.length ? (
          <>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {candidates.map((c) => (
                <li key={c.id}>
                  <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    <AnnotatedImage fileId={c.id} alt={c.name} annotation={view.annotations[c.id]} lazy className="h-full w-full object-cover" />
                  </span>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.name}</p>
                </li>
              ))}
            </ul>
            <FieldGrid cols={4}>
              {Array.from({ length: REPORT_MAX_IMAGES }, (_, i) => (
                <Field key={i} label={`Imagen ${i + 1}`}>
                  <Select name={`image${i + 1}`} defaultValue={report.imageIds[i] ?? ''}>
                    <option value="">— Ninguna —</option>
                    {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </Field>
              ))}
            </FieldGrid>
          </>
        ) : <p className="text-[14px] text-muted-foreground">La paciente no tiene imágenes térmicas. Súbalas en Oncología → Termografías.</p>}
      </ActionForm>
    </Card>
  )
}
