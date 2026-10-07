/**
 * Subconjunto de la CIE-10 (OMS), catálogo obligatorio para codificar diagnósticos (NOM-024-SSA3-2012).
 * Contiene los diagnósticos más frecuentes en consulta general, gastroenterología, cirugía y patología mamaria.
 * En la fase 2 se carga el catálogo completo de la DGIS en la base de datos.
 */
export const cie10 = [
  // Infecciosas
  ['A09', 'Diarrea y gastroenteritis de presunto origen infeccioso'],
  ['A04.7', 'Enterocolitis debida a Clostridium difficile'],
  ['B15.9', 'Hepatitis aguda tipo A, sin coma hepático'],
  ['B18.2', 'Hepatitis viral tipo C crónica'],
  ['B96.8', 'Otros agentes bacterianos especificados (Helicobacter pylori)'],
  ['J00', 'Rinofaringitis aguda (resfriado común)'],
  ['J02.9', 'Faringitis aguda, no especificada'],
  ['J18.9', 'Neumonía, no especificada'],
  ['N39.0', 'Infección de vías urinarias, sitio no especificado'],
  ['U07.1', 'COVID-19, virus identificado'],
  // Neoplasias
  ['C16.9', 'Tumor maligno del estómago, parte no especificada'],
  ['C18.9', 'Tumor maligno del colon, parte no especificada'],
  ['C20', 'Tumor maligno del recto'],
  ['C25.9', 'Tumor maligno del páncreas, parte no especificada'],
  ['C50.9', 'Tumor maligno de la mama, parte no especificada'],
  ['D24', 'Tumor benigno de la mama'],
  ['N60.1', 'Mastopatía quística difusa'],
  ['N63', 'Masa no especificada en la mama'],
  ['N64.4', 'Mastodinia'],
  ['R92', 'Hallazgos anormales en diagnóstico por imagen de la mama'],
  ['D12.6', 'Tumor benigno del colon, parte no especificada (pólipo)'],
  // Sangre, endocrinas y metabólicas
  ['D50.9', 'Anemia por deficiencia de hierro sin otra especificación'],
  ['E03.9', 'Hipotiroidismo, no especificado'],
  ['E11.9', 'Diabetes mellitus tipo 2 sin complicaciones'],
  ['E11.6', 'Diabetes mellitus tipo 2 con otras complicaciones especificadas'],
  ['E66.9', 'Obesidad, no especificada'],
  ['E78.5', 'Hiperlipidemia, no especificada'],
  ['E86', 'Depleción del volumen (deshidratación)'],
  // Mentales y neurológicas
  ['F32.9', 'Episodio depresivo, no especificado'],
  ['F41.1', 'Trastorno de ansiedad generalizada'],
  ['F10.2', 'Trastornos mentales y del comportamiento debidos al uso de alcohol: síndrome de dependencia'],
  ['G43.9', 'Migraña, no especificada'],
  ['G47.3', 'Apnea del sueño'],
  // Circulatorias
  ['I10', 'Hipertensión esencial (primaria)'],
  ['I20.9', 'Angina de pecho, no especificada'],
  ['I21.9', 'Infarto agudo del miocardio, sin otra especificación'],
  ['I48', 'Fibrilación y aleteo auricular'],
  ['I50.9', 'Insuficiencia cardiaca, no especificada'],
  ['I63.9', 'Infarto cerebral, no especificado'],
  ['I83.9', 'Venas varicosas de los miembros inferiores sin úlcera ni inflamación'],
  ['I84.9', 'Hemorroides no especificadas, sin complicación'],
  ['I85.0', 'Várices esofágicas con hemorragia'],
  // Respiratorias
  ['J44.9', 'Enfermedad pulmonar obstructiva crónica, no especificada'],
  ['J45.9', 'Asma, no especificada'],
  // Digestivas
  ['K20', 'Esofagitis'],
  ['K21.0', 'Enfermedad del reflujo gastroesofágico con esofagitis'],
  ['K21.9', 'Enfermedad del reflujo gastroesofágico sin esofagitis'],
  ['K22.0', 'Acalasia del cardias'],
  ['K22.7', 'Esófago de Barrett'],
  ['K25.9', 'Úlcera gástrica, no especificada como aguda ni crónica, sin hemorragia ni perforación'],
  ['K26.9', 'Úlcera duodenal, no especificada como aguda ni crónica, sin hemorragia ni perforación'],
  ['K29.5', 'Gastritis crónica, no especificada'],
  ['K29.7', 'Gastritis, no especificada'],
  ['K30', 'Dispepsia funcional'],
  ['K35.8', 'Apendicitis aguda, otra y la no especificada'],
  ['K40.9', 'Hernia inguinal unilateral o no especificada, sin obstrucción ni gangrena'],
  ['K42.9', 'Hernia umbilical sin obstrucción ni gangrena'],
  ['K43.9', 'Hernia ventral sin obstrucción ni gangrena'],
  ['K44.9', 'Hernia diafragmática sin obstrucción ni gangrena (hernia hiatal)'],
  ['K50.9', 'Enfermedad de Crohn, no especificada'],
  ['K51.9', 'Colitis ulcerativa, sin otra especificación'],
  ['K56.6', 'Otras obstrucciones intestinales y las no especificadas'],
  ['K57.3', 'Enfermedad diverticular del intestino grueso sin perforación ni absceso'],
  ['K58.9', 'Síndrome del colon irritable sin diarrea'],
  ['K59.0', 'Constipación'],
  ['K60.2', 'Fisura anal, no especificada'],
  ['K61.0', 'Absceso anal'],
  ['K62.1', 'Pólipo rectal'],
  ['K63.5', 'Pólipo del colon'],
  ['K70.3', 'Cirrosis hepática alcohólica'],
  ['K74.6', 'Otras cirrosis del hígado y las no especificadas'],
  ['K75.8', 'Esteatohepatitis no alcohólica (NASH)'],
  ['K76.0', 'Degeneración grasa del hígado, no clasificada en otra parte (esteatosis)'],
  ['K80.2', 'Cálculo de la vesícula biliar sin colecistitis'],
  ['K80.5', 'Cálculo de conducto biliar sin colangitis ni colecistitis (coledocolitiasis)'],
  ['K81.0', 'Colecistitis aguda'],
  ['K81.1', 'Colecistitis crónica'],
  ['K85.9', 'Pancreatitis aguda, no especificada'],
  ['K86.1', 'Otras pancreatitis crónicas'],
  ['K90.0', 'Enfermedad celíaca'],
  ['K92.0', 'Hematemesis'],
  ['K92.1', 'Melena'],
  ['K92.2', 'Hemorragia gastrointestinal, no especificada'],
  // Musculoesqueléticas, piel y renales
  ['L03.9', 'Celulitis de sitio no especificado'],
  ['L89.9', 'Úlcera de decúbito y por presión, de sitio no especificado'],
  ['M54.5', 'Lumbago no especificado'],
  ['M17.9', 'Gonartrosis, no especificada'],
  ['N18.9', 'Enfermedad renal crónica, no especificada'],
  ['N20.0', 'Cálculo del riñón'],
  // Embarazo
  ['O80', 'Parto único espontáneo'],
  ['Z34.9', 'Supervisión de embarazo normal no especificado'],
  // Síntomas y signos
  ['R10.1', 'Dolor abdominal localizado en parte superior (epigastralgia)'],
  ['R10.4', 'Otros dolores abdominales y los no especificados'],
  ['R11', 'Náusea y vómito'],
  ['R12', 'Acidez (pirosis)'],
  ['R13', 'Disfagia'],
  ['R17', 'Ictericia no especificada'],
  ['R19.7', 'Diarrea, no especificada'],
  ['R50.9', 'Fiebre, no especificada'],
  ['R51', 'Cefalea'],
  ['R63.4', 'Pérdida anormal de peso'],
  // Traumatismos
  ['S06.0', 'Concusión'],
  ['T18.1', 'Cuerpo extraño en el esófago'],
  ['T78.4', 'Alergia no especificada'],
  ['T88.7', 'Efecto adverso no especificado de droga o medicamento'],
  // Factores que influyen en el estado de salud
  ['Z00.0', 'Examen médico general'],
  ['Z01.8', 'Otros exámenes especiales especificados (valoración preoperatoria)'],
  ['Z09.8', 'Examen de seguimiento consecutivo a otros tratamientos'],
  ['Z12.1', 'Examen de pesquisa especial para tumor del tracto intestinal'],
  ['Z12.3', 'Examen de pesquisa especial para tumor de la mama'],
  ['Z80.3', 'Historia familiar de tumor maligno de mama'],
  ['Z72.0', 'Problemas relacionados con el uso del tabaco'],
  ['Z95.0', 'Presencia de marcapaso cardiaco'],
] as const satisfies readonly (readonly [string, string])[]

export const cie10Options = cie10.map(([code, description]) => `${code} — ${description}`)

/** Separa "K21.9 — Descripción" en código y descripción. Acepta texto libre si no viene del catálogo. */
export function parseDiagnosis(value: string): { code?: string; description: string } {
  const match = value.match(/^([A-Z]\d{2}(?:\.\d{1,2})?)\s+[—-]\s+(.+)$/)
  if (match) return { code: match[1], description: match[2].trim() }
  const known = cie10.find(([code]) => code === value.trim().toUpperCase())
  return known ? { code: known[0], description: known[1] } : { description: value.trim() }
}
