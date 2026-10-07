const locale = 'es-MX'
const timeZone = 'America/Mexico_City'

/** Las fechas se guardan como ISO (`2026-09-27`) y se formatean solo al mostrarse. */
function parse(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
}

export function formatDate(iso: string, style: 'long' | 'medium' | 'short' = 'long') {
  const options: Intl.DateTimeFormatOptions =
    style === 'long' ? { day: 'numeric', month: 'long', year: 'numeric' }
      : style === 'medium' ? { day: 'numeric', month: 'short', year: 'numeric' }
        : { day: 'numeric', month: 'short' }
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(parse(iso))
}

export function formatWeekday(date = new Date()) {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone }).format(date)
}

export function todayISO(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date)
}

export function addDaysISO(iso: string, days: number) {
  const date = parse(iso)
  date.setDate(date.getDate() + days)
  return todayISO(date)
}

export function ageFrom(birthDate: string, now = new Date()) {
  const birth = parse(birthDate)
  let age = now.getFullYear() - birth.getFullYear()
  const beforeBirthday = now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  if (beforeBirthday) age--
  return age
}

export function greeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(date))
  return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export function firstName(fullName: string) {
  return fullName.replace(/^(Dr\.|Dra\.|Ing\.|Q\.F\.B\.|Lic\.|Enf\.)\s+/, '').split(' ')[0]
}

export function nowISO() {
  return new Date().toISOString()
}

/** Fecha y hora local de la clínica para marcas de tiempo completas (`2026-09-27T16:05:00.000Z`). */
export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(new Date(iso))
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(new Date(iso))
}

/** Días entre hoy y una fecha ISO (negativo si ya pasó). */
export function daysUntil(iso: string, today = todayISO()) {
  return Math.round((parse(iso.slice(0, 10)).getTime() - parse(today).getTime()) / 86_400_000)
}

export function addMonthsISO(iso: string, months: number) {
  const date = parse(iso.slice(0, 10))
  date.setMonth(date.getMonth() + months)
  return todayISO(date)
}

const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
export function formatCurrency(value: number) {
  return currency.format(value)
}

const number = new Intl.NumberFormat(locale)
export function formatNumber(value: number) {
  return number.format(value)
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`
}

/** Horas transcurridas desde una marca de tiempo ISO. */
export function hoursSince(iso: string, now = Date.now()) {
  return (now - new Date(iso).getTime()) / 3_600_000
}

/** Minutos transcurridos del día en la zona horaria de la clínica (para la línea de "ahora"). */
export function minutesNow(date = new Date()) {
  const [h, m] = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZone }).format(date).split(':').map(Number)
  return h * 60 + m
}
