import type { BadgeTone } from '@/components/ui/badge'
import type { Allergy, VitalSigns } from './types'

/*
 * Reglas de apoyo a la decisión clínica (pacientes adultos). Son alertas orientativas:
 * nunca sustituyen el juicio del profesional. Archivo puro, usable en cliente y servidor.
 */

export type Flag = { tone: Extract<BadgeTone, 'warning' | 'danger'>; label: string }

export type VitalKey = 'bloodPressure' | 'heartRate' | 'respiratoryRate' | 'temperature' | 'spo2' | 'glucose' | 'pain'

export function vitalFlags(v: VitalSigns): Partial<Record<VitalKey, Flag>> {
  const flags: Partial<Record<VitalKey, Flag>> = {}
  const { systolic: s, diastolic: d } = v

  if (s !== undefined && d !== undefined) {
    if (s >= 180 || d >= 120) flags.bloodPressure = { tone: 'danger', label: 'Crisis hipertensiva' }
    else if (s < 90) flags.bloodPressure = { tone: 'danger', label: 'Hipotensión' }
    else if (s >= 140 || d >= 90) flags.bloodPressure = { tone: 'warning', label: 'Hipertensión' }
  }
  if (v.heartRate !== undefined) {
    if (v.heartRate > 120 || v.heartRate < 45) flags.heartRate = { tone: 'danger', label: v.heartRate > 120 ? 'Taquicardia' : 'Bradicardia' }
    else if (v.heartRate > 100 || v.heartRate < 60) flags.heartRate = { tone: 'warning', label: v.heartRate > 100 ? 'Taquicardia' : 'Bradicardia' }
  }
  if (v.respiratoryRate !== undefined) {
    if (v.respiratoryRate > 24 || v.respiratoryRate < 10) flags.respiratoryRate = { tone: 'danger', label: v.respiratoryRate > 24 ? 'Taquipnea' : 'Bradipnea' }
    else if (v.respiratoryRate > 20 || v.respiratoryRate < 12) flags.respiratoryRate = { tone: 'warning', label: v.respiratoryRate > 20 ? 'Taquipnea' : 'Bradipnea' }
  }
  if (v.temperature !== undefined) {
    if (v.temperature >= 39) flags.temperature = { tone: 'danger', label: 'Fiebre alta' }
    else if (v.temperature >= 38) flags.temperature = { tone: 'warning', label: 'Fiebre' }
    else if (v.temperature < 35) flags.temperature = { tone: 'danger', label: 'Hipotermia' }
  }
  if (v.spo2 !== undefined) {
    if (v.spo2 < 90) flags.spo2 = { tone: 'danger', label: 'Hipoxemia' }
    else if (v.spo2 < 94) flags.spo2 = { tone: 'warning', label: 'Saturación baja' }
  }
  if (v.glucose !== undefined) {
    if (v.glucose < 70) flags.glucose = { tone: 'danger', label: 'Hipoglucemia' }
    else if (v.glucose > 250) flags.glucose = { tone: 'danger', label: 'Hiperglucemia grave' }
    else if (v.glucose > 180) flags.glucose = { tone: 'warning', label: 'Hiperglucemia' }
  }
  if (v.pain !== undefined && v.pain >= 7) flags.pain = { tone: 'warning', label: 'Dolor intenso' }

  return flags
}

export function bmi(weightKg?: number, heightM?: number) {
  if (!weightKg || !heightM) return undefined
  const value = weightKg / (heightM * heightM)
  const category = value < 18.5 ? 'Bajo peso' : value < 25 ? 'Normal' : value < 30 ? 'Sobrepeso' : value < 35 ? 'Obesidad grado I' : value < 40 ? 'Obesidad grado II' : 'Obesidad grado III'
  return { value: Math.round(value * 10) / 10, category, tone: (value < 18.5 || value >= 30 ? 'warning' : value >= 25 ? 'accent' : 'success') as BadgeTone }
}

/**
 * NEWS2 (National Early Warning Score 2, Royal College of Physicians, 2017),
 * escala 1 de SpO₂. Requiere FR, SpO₂, TA sistólica, FC y temperatura.
 */
export function news2(v: VitalSigns): { score: number; risk: 'bajo' | 'bajo-medio' | 'medio' | 'alto'; tone: BadgeTone; response: string } | undefined {
  const { respiratoryRate: rr, spo2, systolic: sbp, heartRate: hr, temperature: t } = v
  if (rr === undefined || spo2 === undefined || sbp === undefined || hr === undefined || t === undefined) return undefined

  const parts = [
    rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3,
    spo2 <= 91 ? 3 : spo2 <= 93 ? 2 : spo2 <= 95 ? 1 : 0,
    v.onOxygen ? 2 : 0,
    sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : sbp <= 219 ? 0 : 3,
    hr <= 40 ? 3 : hr <= 50 ? 1 : hr <= 90 ? 0 : hr <= 110 ? 1 : hr <= 130 ? 2 : 3,
    v.consciousness === 'A' ? 0 : 3,
    t <= 35 ? 3 : t <= 36 ? 1 : t <= 38 ? 0 : t <= 39 ? 1 : 2,
  ]
  const score = parts.reduce((sum, part) => sum + part, 0)

  if (score >= 7) return { score, risk: 'alto', tone: 'danger', response: 'Respuesta de emergencia: valoración inmediata por equipo de respuesta rápida.' }
  if (score >= 5) return { score, risk: 'medio', tone: 'danger', response: 'Respuesta urgente: valoración médica inmediata y monitoreo cada hora.' }
  if (parts.includes(3)) return { score, risk: 'bajo-medio', tone: 'warning', response: 'Un parámetro en rango extremo: valoración médica urgente.' }
  return { score, risk: 'bajo', tone: score === 0 ? 'success' : 'accent', response: score === 0 ? 'Monitoreo de rutina.' : 'Monitoreo cada 4 a 6 horas y valoración por enfermería.' }
}

// ── Alergias ────────────────────────────────────────────────────────────────────

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Familias farmacológicas con reactividad cruzada conocida. */
const drugFamilies: Record<string, string[]> = {
  penicilinas: ['penicilina', 'amoxicilina', 'ampicilina', 'dicloxacilina', 'piperacilina', 'bencilpenicilina'],
  cefalosporinas: ['cefalexina', 'cefazolina', 'cefuroxima', 'ceftriaxona', 'cefotaxima', 'cefepima', 'cefixima'],
  sulfonamidas: ['sulfa', 'sulfametoxazol', 'sulfasalazina'],
  aines: ['aine', 'acido acetilsalicilico', 'aspirina', 'ibuprofeno', 'naproxeno', 'diclofenaco', 'ketorolaco', 'ketoprofeno', 'metamizol', 'celecoxib', 'indometacina', 'piroxicam'],
  opioides: ['morfina', 'tramadol', 'codeina', 'fentanilo', 'buprenorfina', 'oxicodona', 'nalbufina'],
  quinolonas: ['ciprofloxacino', 'levofloxacino', 'moxifloxacino', 'norfloxacino'],
  macrolidos: ['claritromicina', 'azitromicina', 'eritromicina'],
  'medios de contraste yodados': ['yodo', 'contraste yodado', 'iopamidol', 'iohexol'],
}

const familyLabels: Record<string, string> = { aines: 'AINE', macrolidos: 'macrólidos' }
const familyLabel = (family: string) => familyLabels[family] ?? family

/** Penicilinas y cefalosporinas comparten anillo betalactámico: riesgo cruzado bajo pero real. */
const crossFamilies: Record<string, string[]> = { penicilinas: ['cefalosporinas'] }

export type AllergyConflict = { allergy: Allergy; level: 'directa' | 'cruzada'; detail: string }

export function allergyConflicts(drugName: string, allergies: Allergy[]): AllergyConflict[] {
  const drug = normalize(drugName)
  const familyOf = (term: string) => Object.entries(drugFamilies).find(([family, members]) => normalize(family).includes(term) || members.some((member) => term.includes(member) || member.includes(term)))?.[0]
  const conflicts: AllergyConflict[] = []

  for (const allergy of allergies) {
    if (allergy.kind !== 'medicamento') continue
    const agent = normalize(allergy.agent)
    if (drug.includes(agent)) {
      conflicts.push({ allergy, level: 'directa', detail: `El paciente es alérgico a ${allergy.agent}.` })
      continue
    }
    const family = familyOf(agent)
    if (!family) continue
    if (drugFamilies[family].some((member) => drug.includes(member))) {
      conflicts.push({ allergy, level: 'directa', detail: `${drugName} pertenece a la familia de ${familyLabel(family)}, igual que ${allergy.agent}.` })
    } else if (crossFamilies[family]?.some((cross) => drugFamilies[cross].some((member) => drug.includes(member)))) {
      conflicts.push({ allergy, level: 'cruzada', detail: `Posible reactividad cruzada entre ${familyLabel(family)} (${allergy.agent}) y ${drugName}.` })
    }
  }
  return conflicts
}
