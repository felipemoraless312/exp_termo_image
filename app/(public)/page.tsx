import Link from 'next/link'
import {
  Activity, ArrowRight, BellRing, Check, ClipboardList, FileSignature, FileText, FlaskConical, HeartPulse, History, KeyRound, Lock,
  Pill, ScrollText, ShieldAlert, Stethoscope, User, UserCheck, Users, X,
} from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { platform } from '@/config/platform'
import { reveal } from '@/lib/motion'
import { cn } from '@/lib/utils'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <WhatIs />
      <Contents />
      <Profiles />
      <HowItWorks />
      <Security />
      <Faq />
      <CallToAction />
    </>
  )
}

function Section({ id, eyebrow, title, intro, tone = 'default', children }: {
  id?: string
  eyebrow: string
  title: string
  intro?: string
  tone?: 'default' | 'card'
  children: React.ReactNode
}) {
  return (
    <section id={id} className={tone === 'card' ? 'scroll-mt-14 bg-card' : 'scroll-mt-14'}>
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="max-w-2xl" {...reveal()}>
          <p className="text-eyebrow">{eyebrow}</p>
          <h2 className="mt-2 text-title-1">{title}</h2>
          {intro && <p className="mt-4 text-[17px] leading-7 text-muted-foreground">{intro}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  )
}

// ── Portada ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="aurora" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 pt-14 text-center sm:pt-24">
        <p className="hero-drop inline-flex items-center gap-2 rounded-full bg-card/80 px-3.5 py-1.5 text-[13px] font-semibold text-accent-foreground shadow-card ring-1 ring-border backdrop-blur">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Expediente clínico electrónico
        </p>
        <h1 className="hero-fade mx-auto mt-5 max-w-4xl text-balance text-display [--d:150ms]">
          Tu historial clínico, <span className="text-sheen">completo</span> y en un solo lugar.
        </h1>
        <p className="hero-fade mx-auto mt-5 max-w-2xl text-pretty text-[19px] leading-7 text-muted-foreground [--d:400ms]">
          {platform.name} reúne tus antecedentes, consultas, estudios y tratamientos para que tu médico vea toda tu historia
          —no solo la consulta de hoy—, tú la tengas a la mano y tu familia pueda consultarla en una emergencia.
        </p>
        <div className="hero-fade mt-8 flex flex-wrap justify-center gap-3 [--d:600ms]">
          <Link href="/portal" className={buttonVariants({ size: 'lg', className: 'btn-shine shadow-[0_8px_24px_rgb(0_113_227/0.3)]' })}>Entrar al portal del paciente</Link>
          <Link href="#que-es" className={buttonVariants({ size: 'lg', variant: 'link', className: 'px-2' })}>
            ¿Qué es un expediente electrónico? <ArrowRight />
          </Link>
        </div>
      </div>

      <div className="hero-fade relative mx-auto mt-14 max-w-4xl px-5 [--d:800ms]">
        <RecordPreview />
      </div>
    </section>
  )
}

/** Vista ilustrativa de un expediente: resume en una imagen lo que ofrece el programa. */
function RecordPreview() {
  const timeline = [
    { icon: Stethoscope, date: '27 sep 2026', title: 'Nota de evolución', detail: 'ERGE con esofagitis grado A · Omeprazol 20 mg' },
    { icon: FlaskConical, date: '27 sep 2026', title: 'Panendoscopía', detail: 'Resultado liberado al paciente' },
    { icon: HeartPulse, date: '16 ago 2026', title: 'Signos vitales', detail: 'TA 132/84 · FC 78 · SpO₂ 98 %' },
    { icon: ClipboardList, date: '16 ago 2026', title: 'Historia clínica', detail: 'Antecedentes, exploración física y plan' },
  ]
  return (
    <div className="overflow-hidden rounded-3xl bg-card text-left shadow-float ring-1 ring-border">
      <div className="flex flex-wrap items-center gap-4 border-b border-separator p-5 sm:p-6">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground"><User size={22} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Juan Pérez López</p>
          <p className="text-[13px] text-muted-foreground">EXP-000123 · 45 años · O+</p>
        </div>
        <span className="rounded-full bg-success-soft px-3 py-1 text-[12px] font-medium text-success">Sin alergias registradas</span>
      </div>
      <div className="grid sm:grid-cols-[1fr_0.8fr]">
        <ol className="space-y-4 p-5 sm:p-6">
          <li className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground"><History size={15} aria-hidden="true" /> Historial clínico</li>
          {timeline.map(({ icon: Icon, date, title, detail }) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><Icon size={15} aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block text-[14px] font-medium">{title} <span className="font-normal text-subtle">· {date}</span></span>
                <span className="block truncate text-[13px] text-muted-foreground">{detail}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="space-y-3 border-t border-separator bg-background/60 p-5 sm:border-l sm:border-t-0 sm:p-6">
          <p className="text-[13px] font-medium text-muted-foreground">Diagnósticos activos</p>
          <p className="rounded-xl bg-card p-3 text-[13px] shadow-card">K21.0 · Reflujo gastroesofágico con esofagitis</p>
          <p className="text-[13px] font-medium text-muted-foreground">Tratamiento actual</p>
          <p className="rounded-xl bg-card p-3 text-[13px] shadow-card">Omeprazol 20 mg · cada 24 h · 8 semanas</p>
          <p className="flex items-center gap-2 rounded-xl bg-accent p-3 text-[13px] text-accent-foreground"><UserCheck size={15} aria-hidden="true" /> Elena López (cónyuge) tiene acceso</p>
        </div>
      </div>
    </div>
  )
}

// ── El problema ─────────────────────────────────────────────────────────────────

function Problem() {
  const without = [
    'El médico solo ve la consulta de hoy y depende de lo que el paciente recuerde.',
    'Estudios y recetas se pierden entre papeles, fotos y carpetas.',
    'Alergias o enfermedades previas pasan inadvertidas al prescribir.',
    'En una urgencia, la familia no tiene a la mano la información del paciente.',
  ]
  const withIt = [
    'El médico consulta todo el historial: antecedentes, notas, estudios y tratamientos.',
    'Cada registro queda fechado, firmado y ordenado en un solo expediente.',
    'El sistema alerta sobre alergias y dispositivos implantados antes de actuar.',
    'Un contacto autorizado puede ver la información clave cuando hace falta.',
  ]
  return (
    <Section id="por-que" tone="card" eyebrow="Por qué" title="Sin historial, cada consulta empieza de cero." intro="Cuando la información clínica está dispersa, el médico atiende solo con lo que ve en la consulta. El expediente electrónico le devuelve el contexto completo.">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl bg-background p-7 sm:p-8" {...reveal(0)}>
          <h3 className="text-title-3">Sin expediente electrónico</h3>
          <ul className="mt-5 space-y-3.5">
            {without.map((item) => (
              <li key={item} className="flex gap-3 leading-6 text-muted-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger"><X size={12} aria-hidden="true" /></span>{item}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-3xl bg-primary p-7 text-primary-foreground sm:p-8" {...reveal(1)}>
          <h3 className="text-title-3">Con {platform.name}</h3>
          <ul className="mt-5 space-y-3.5">
            {withIt.map((item) => (
              <li key={item} className="flex gap-3 leading-6">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20"><Check size={12} aria-hidden="true" /></span>{item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </Section>
  )
}

// ── Qué es ──────────────────────────────────────────────────────────────────────

function WhatIs() {
  const points = [
    { title: 'Un solo registro por paciente', detail: 'Todo lo que ocurre en la atención —consultas, estudios, recetas, consentimientos— se integra al mismo expediente, identificado con un número que no cambia.' },
    { title: 'Ordenado según la norma', detail: 'Sigue la estructura de la NOM-004-SSA3-2012 del expediente clínico: ficha de identificación, historia clínica, notas médicas, tratamiento y auxiliares de diagnóstico.' },
    { title: 'Seguro y trazable', detail: 'Toma como referencia la NOM-024-SSA3-2012: cada consulta o cambio queda en una bitácora, y las notas firmadas no se modifican; las correcciones se agregan como adendas.' },
  ]
  return (
    <Section id="que-es" eyebrow="Qué es" title="¿Qué es un expediente clínico electrónico?" intro="Es la versión digital del expediente clínico: el conjunto de documentos en los que el personal de salud registra la historia, la evolución y el tratamiento de un paciente. Al ser electrónico, se puede consultar completo, desde cualquier lugar y solo por quien tiene permiso.">
      <div className="grid gap-4 md:grid-cols-3">
        {points.map((point, i) => (
          <article key={point.title} className="lift rounded-3xl bg-card p-7 shadow-card" {...reveal(i)}>
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-[14px] font-semibold text-primary-foreground tabular-nums">{i + 1}</span>
            <h3 className="mt-5 text-title-3">{point.title}</h3>
            <p className="mt-2 leading-7 text-muted-foreground">{point.detail}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}

// ── Qué contiene ────────────────────────────────────────────────────────────────

function Contents() {
  const items = [
    { icon: User, title: 'Ficha de identificación', detail: 'Datos personales, afiliación, contacto de emergencia y responsable legal.' },
    { icon: ClipboardList, title: 'Historia clínica', detail: 'Antecedentes heredofamiliares, personales, quirúrgicos, gineco-obstétricos y vacunas.' },
    { icon: Stethoscope, title: 'Notas médicas', detail: 'Historia clínica, evolución, interconsulta, urgencias, pre y postoperatorias, egreso.' },
    { icon: HeartPulse, title: 'Signos vitales', detail: 'Registro histórico con alertas automáticas (NEWS2) ante valores críticos.' },
    { icon: Pill, title: 'Tratamiento', detail: 'Recetas con folio, medicamentos activos y anteriores, con alerta de alergias.' },
    { icon: FlaskConical, title: 'Estudios', detail: 'Laboratorio, imagen y endoscopía; el médico decide cuándo liberar el resultado.' },
    { icon: ShieldAlert, title: 'Alergias y dispositivos', detail: 'Alergias con su severidad e implantes con su compatibilidad con resonancia.' },
    { icon: FileSignature, title: 'Consentimientos y documentos', detail: 'Consentimientos informados con testigos, recetas y reportes en un solo sitio.' },
  ]
  return (
    <Section id="contenido" tone="card" eyebrow="Qué contiene" title="Toda la historia clínica, organizada." intro="El expediente acompaña al paciente en cada consulta: completo, en orden y con lo importante siempre a la vista.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, detail }, i) => (
          <article key={title} className="lift rounded-2xl bg-background p-6" {...reveal(i % 4)}>
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary"><Icon size={19} aria-hidden="true" /></span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1.5 text-[14px] leading-6 text-muted-foreground">{detail}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}

// ── Quién lo usa ────────────────────────────────────────────────────────────────

function Profiles() {
  const roles = [
    {
      icon: User, title: 'Paciente', href: '/portal', cta: 'Portal del paciente',
      features: ['Consulta su historial: diagnósticos, tratamiento, consultas y estudios.', 'Revisa sus documentos y resultados liberados.', 'Decide quién más puede ver su información y lo revoca cuando quiera.'],
    },
    {
      icon: Stethoscope, title: 'Médico', href: '/sistema/login', cta: 'Acceso médico',
      features: ['Ve el expediente completo y la línea de tiempo de todos sus pacientes.', 'Registra notas firmadas, signos vitales, recetas y estudios.', 'Sabe quién ha consultado cada expediente.'],
    },
    {
      icon: Users, title: 'Contacto autorizado', href: '/portal/login', cta: 'Entrar como contacto',
      features: ['Familiar o contacto de emergencia elegido por el paciente.', 'Entra con el número de expediente y un código personal.', 'Solo lectura: información de emergencia o expediente completo.'],
    },
  ]
  return (
    <Section id="usuarios" eyebrow="Quién lo usa" title="Tres perfiles, cada uno con lo que necesita." intro="Cada persona ve únicamente lo que le corresponde. El paciente decide con quién compartir su información.">
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map(({ icon: Icon, title, href, cta, features }, i) => (
          <article key={title} className="lift group relative flex flex-col overflow-hidden rounded-3xl bg-card p-8 shadow-card" {...reveal(i)}>
            <div aria-hidden="true" className="absolute -right-16 -top-16 size-48 rounded-full bg-accent transition-transform duration-700 ease-apple group-hover:scale-125" />
            <span className="relative flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_20px_rgb(0_113_227/0.25)] transition-transform duration-500 ease-apple group-hover:-rotate-6 group-hover:scale-110">
              <Icon size={22} aria-hidden="true" />
            </span>
            <h3 className="relative mt-6 text-title-2">{title}</h3>
            <ul className="relative mt-5 flex-1 space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex gap-2.5 text-[15px] leading-6 text-muted-foreground"><Check size={16} className="mt-1 shrink-0 text-primary" aria-hidden="true" />{feature}</li>
              ))}
            </ul>
            <Link href={href} className={buttonVariants({ variant: 'secondary', className: 'relative mt-7 self-start' })}>{cta} <ArrowRight /></Link>
          </article>
        ))}
      </div>
    </Section>
  )
}

// ── Cómo funciona ───────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { title: 'Se abre el expediente', detail: 'En la primera visita, el médico registra la ficha de identificación y la historia clínica.' },
    { title: 'Cada atención se registra', detail: 'Notas, signos vitales, recetas y estudios se agregan al mismo expediente, firmados.' },
    { title: 'El paciente lo consulta', detail: 'Desde el portal ve su historial con su número de expediente y fecha de nacimiento.' },
    { title: 'Autoriza a un contacto', detail: 'Genera un código para un familiar, con el nivel de acceso que elija.' },
    { title: 'Disponible cuando importa', detail: 'En una urgencia, la información clave está a la mano de quien tiene permiso.' },
  ]
  return (
    <Section id="como-funciona" tone="card" eyebrow="Cómo funciona" title="De la primera consulta a la urgencia.">
      <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <li aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-9 hidden h-0.5 rounded-full bg-gradient-to-r from-primary/20 via-primary to-primary/20 lg:block" {...reveal(0, 'line')} />
        {steps.map((step, index) => (
          <li key={step.title} className="lift relative rounded-2xl bg-background p-5" {...reveal(index, 'scale')}>
            <span className="relative flex size-8 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground ring-4 ring-background tabular-nums">{index + 1}</span>
            <p className="mt-4 font-medium leading-6">{step.title}</p>
            <p className="mt-1.5 text-[14px] leading-6 text-muted-foreground">{step.detail}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

// ── Seguridad ───────────────────────────────────────────────────────────────────

function Security() {
  const items = [
    { icon: Lock, title: 'Acceso por perfil', detail: 'El médico, el paciente y sus contactos solo ven lo que les corresponde.' },
    { icon: ScrollText, title: 'Bitácora de accesos', detail: 'Cada consulta y cada cambio quedan registrados con fecha, hora y autor.' },
    { icon: FileSignature, title: 'Notas inalterables', detail: 'Las notas se firman electrónicamente; una corrección se agrega como adenda.' },
    { icon: KeyRound, title: 'Códigos personales', detail: 'El acceso de un contacto usa un código único que se guarda cifrado.' },
    { icon: BellRing, title: 'Revocación inmediata', detail: 'Si el paciente retira el permiso, el contacto pierde el acceso al instante.' },
    { icon: Activity, title: 'Alertas clínicas', detail: 'Avisos de alergias, dispositivos implantados y signos vitales críticos.' },
  ]
  return (
    <Section id="seguridad" eyebrow="Privacidad y seguridad" title="Tu información es confidencial." intro="La información clínica es de la más sensible que existe. Por eso el expediente controla quién la ve y deja constancia de cada acceso.">
      <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, detail }, i) => (
          <li key={title} className="flex gap-4 border-b border-separator py-6" {...reveal(i % 3)}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary"><Icon size={18} aria-hidden="true" /></span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="mt-1 block text-[14px] leading-6 text-muted-foreground">{detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

// ── Preguntas frecuentes ────────────────────────────────────────────────────────

function Faq() {
  const questions = [
    { q: '¿De quién es la información?', a: 'El establecimiento de salud integra y resguarda el expediente, pero la información es del paciente: puede consultarla y decidir a quién más compartírsela.' },
    { q: '¿Cómo entro como paciente?', a: 'En el portal del paciente, con tu número de expediente y tu fecha de nacimiento. El número de expediente te lo da tu médico.' },
    { q: '¿Cómo autorizo a un familiar?', a: 'En el portal, en “Acceso asistido”, registra a tu contacto y elige el nivel de acceso. Se genera un código que verás una sola vez; compártelo con esa persona.' },
    { q: '¿Qué ve mi contacto autorizado?', a: 'Según lo que elijas: solo la información de emergencia (alergias, grupo sanguíneo, diagnósticos, tratamiento y dispositivos) o el expediente completo. Nunca puede modificar nada.' },
    { q: '¿Puedo ver todos mis estudios?', a: 'Ves los resultados que tu médico ya revisó y liberó; así recibes cada resultado con su interpretación.' },
    { q: '¿Puedo corregir mis datos?', a: 'Puedes solicitar la corrección desde “Mis datos”. Las notas médicas no se borran: las correcciones se agregan como adendas, como pide la norma.' },
  ]
  return (
    <Section id="preguntas" tone="card" eyebrow="Preguntas frecuentes" title="Lo que suele preguntarse.">
      <div className="grid items-start gap-3 lg:grid-cols-2">
        {questions.map(({ q, a }, i) => (
          <details key={q} className="group rounded-2xl bg-background p-5 open:shadow-card" {...reveal(i % 2)}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-7 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}

// ── Llamado final ───────────────────────────────────────────────────────────────

function CallToAction() {
  return (
    <section className="px-5 py-20 sm:py-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground shadow-float sm:px-12 sm:py-20" {...reveal(0, 'scale')}>
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_0%,rgb(255_255_255/0.25),transparent_60%),radial-gradient(50%_70%_at_90%_100%,rgb(27_175_122/0.45),transparent_60%)]" />
        <div aria-hidden="true" className="absolute -left-20 -top-24 size-72 animate-[aurora_14s_ease-in-out_infinite_alternate] rounded-full bg-white/10 blur-2xl motion-reduce:animate-none" />
        <div className="relative">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] opacity-80">{platform.tagline}</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-title-1">Tu historia clínica, siempre contigo.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-7 opacity-90">Entra al portal para consultar tu expediente o el de un familiar que te haya autorizado.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/portal" className={cn(buttonVariants({ size: 'lg' }), 'btn-shine bg-white text-primary hover:bg-white/90')}><FileText /> Portal del paciente</Link>
            <Link href="/sistema/login" className={cn(buttonVariants({ size: 'lg', variant: 'ghost' }), 'text-primary-foreground ring-1 ring-white/40 hover:bg-white/15')}><Stethoscope /> Acceso médico</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
