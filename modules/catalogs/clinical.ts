/** Catálogos clínicos de uso general (seguros para cliente y servidor). */

export const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Desconocido'] as const
export type BloodType = (typeof bloodTypes)[number]

export const sexes = ['mujer', 'hombre', 'no-especificado'] as const
export type Sex = (typeof sexes)[number]
export const sexLabels: Record<Sex, string> = { mujer: 'Mujer', hombre: 'Hombre', 'no-especificado': 'No especificado' }

export const maritalStatuses = ['Soltero(a)', 'Casado(a)', 'Unión libre', 'Divorciado(a)', 'Viudo(a)', 'Separado(a)'] as const
export const educationLevels = ['Sin escolaridad', 'Primaria', 'Secundaria', 'Bachillerato', 'Técnico', 'Licenciatura', 'Posgrado'] as const
export const insuranceTypes = ['Particular', 'IMSS', 'ISSSTE', 'IMSS-Bienestar', 'PEMEX', 'SEDENA / SEMAR', 'Seguro de gastos médicos'] as const

export const mexicanStates = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
  'Zacatecas', 'Extranjero',
] as const

export const relatives = ['Madre', 'Padre', 'Abuela materna', 'Abuelo materno', 'Abuela paterna', 'Abuelo paterno', 'Hermano(a)', 'Hijo(a)', 'Tío(a)', 'Otro'] as const
export const emergencyRelationships = ['Cónyuge', 'Padre o madre', 'Hijo o hija', 'Hermano o hermana', 'Tutor legal', 'Otro'] as const

export const familyConditions = [
  'Diabetes mellitus', 'Hipertensión arterial', 'Cardiopatía isquémica', 'Enfermedad vascular cerebral', 'Cáncer gástrico', 'Cáncer de colon',
  'Cáncer de mama', 'Otro cáncer', 'Enfermedad renal crónica', 'Asma', 'Enfermedad tiroidea', 'Enfermedad mental', 'Obesidad', 'Dislipidemia',
] as const

export const allergyKinds = ['medicamento', 'alimento', 'ambiental', 'latex', 'otro'] as const
export type AllergyKind = (typeof allergyKinds)[number]
export const allergyKindLabels: Record<AllergyKind, string> = { medicamento: 'Medicamento', alimento: 'Alimento', ambiental: 'Ambiental', latex: 'Látex', otro: 'Otro' }

export const allergySeverities = ['leve', 'moderada', 'grave'] as const
export type AllergySeverity = (typeof allergySeverities)[number]

export const routes = ['Oral', 'Sublingual', 'Intravenosa', 'Intramuscular', 'Subcutánea', 'Tópica', 'Inhalada', 'Rectal', 'Oftálmica', 'Ótica', 'Nasal', 'Transdérmica'] as const
export const frequencies = ['Cada 4 horas', 'Cada 6 horas', 'Cada 8 horas', 'Cada 12 horas', 'Cada 24 horas', 'Dosis única', 'Antes de cada comida', 'Por razón necesaria (PRN)', 'Cada semana'] as const

export const vaccines = [
  'BCG', 'Hepatitis B', 'Hexavalente', 'Rotavirus', 'Neumocócica conjugada', 'Neumocócica polisacárida 23', 'Influenza estacional',
  'SRP (sarampión, rubéola, parotiditis)', 'DPT', 'Td (tétanos y difteria)', 'Tdpa', 'VPH', 'Hepatitis A', 'Varicela', 'COVID-19', 'Herpes zóster',
] as const

export const studyCategories = ['laboratorio', 'imagen', 'endoscopia', 'gabinete', 'patologia'] as const
export type StudyCategory = (typeof studyCategories)[number]
export const studyCategoryLabels: Record<StudyCategory, string> = { laboratorio: 'Laboratorio', imagen: 'Imagen', endoscopia: 'Endoscopía', gabinete: 'Gabinete', patologia: 'Patología' }

export const commonStudies: Record<StudyCategory, readonly string[]> = {
  laboratorio: ['Biometría hemática', 'Química sanguínea de 6 elementos', 'Perfil hepático', 'Perfil de lípidos', 'Electrolitos séricos', 'Tiempos de coagulación', 'Examen general de orina', 'Hemoglobina glucosilada', 'Amilasa y lipasa', 'Antígeno de H. pylori en heces', 'Coproparasitoscópico seriado', 'Perfil tiroideo', 'Grupo y Rh'],
  imagen: ['Ultrasonido abdominal', 'Radiografía de tórax', 'Tomografía de abdomen contrastada', 'Resonancia magnética de abdomen', 'Colangiorresonancia'],
  endoscopia: ['Panendoscopía', 'Colonoscopía', 'CPRE', 'Cápsula endoscópica', 'Enteroscopía'],
  gabinete: ['Electrocardiograma', 'Manometría esofágica de alta resolución', 'pHmetría con impedancia de 24 h', 'Manometría anorrectal', 'Espirometría'],
  patologia: ['Estudio histopatológico de biopsia', 'Citología'],
}

export const mriSafety = ['segura', 'condicional', 'insegura', 'desconocida'] as const
export type MriSafety = (typeof mriSafety)[number]
export const mriSafetyLabels: Record<MriSafety, string> = { segura: 'Segura en RM', condicional: 'RM condicional', insegura: 'Contraindicada en RM', desconocida: 'Compatibilidad con RM desconocida' }

export const implantTypes = ['Marcapasos', 'Desfibrilador implantable (DAI)', 'Stent coronario', 'Stent biliar', 'Prótesis esofágica', 'Prótesis articular', 'Válvula cardiaca protésica', 'Malla quirúrgica', 'Clip quirúrgico', 'Implante coclear', 'Bomba de insulina', 'Catéter venoso central / puerto', 'Dispositivo intrauterino', 'Otro'] as const

/** Sugerencias para el campo de medicamento al prescribir. Se puede escribir cualquier otro. */
export const commonMedications = [
  'Omeprazol 20 mg cápsulas', 'Pantoprazol 40 mg tabletas', 'Esomeprazol 40 mg tabletas', 'Alginato de sodio suspensión',
  'Butilhioscina 10 mg tabletas', 'Metoclopramida 10 mg tabletas', 'Trimebutina 200 mg tabletas', 'Lactulosa solución oral',
  'Polietilenglicol 3350 sobres', 'Loperamida 2 mg tabletas', 'Paracetamol 500 mg tabletas', 'Metamizol 500 mg tabletas',
  'Ketorolaco 10 mg tabletas', 'Amoxicilina 500 mg cápsulas', 'Ciprofloxacino 500 mg tabletas', 'Metronidazol 500 mg tabletas',
  'Claritromicina 500 mg tabletas', 'Losartán 50 mg tabletas', 'Metformina 850 mg tabletas', 'Insulina glargina 100 UI/ml',
] as const
