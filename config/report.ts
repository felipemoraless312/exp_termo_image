/*
 * Textos fijos del informe de termografía ("Mastografía térmica digital"), tomados de `ejemplos/` con las erratas
 * corregidas (espacios y comas dobles, "patr ón", "94%.,", acentos). El contenido médico no se modificó.
 */

export const thermographyReport = {
  organization: 'Centro de Estudios y Prevención del Cáncer A.C.',
  logo: '/informes/ceprec-logo.png',
  title: 'Mastografía térmica digital',
  clinic: 'Clínica de Mama',
  classification: [
    ['TH1', 'Normal'],
    ['TH2', 'Normal con patrón vascular'],
    ['TH3', 'Anormal benigno'],
    ['TH4', 'Anormal probablemente maligno'],
    ['TH5', 'Muy anormal con alta probabilidad de malignidad'],
  ] as const,
  disclaimer:
    'La mastografía térmica digital ha sido aprobada por la Administración de Medicamentos y Alimentos de los Estados Unidos de América (FDA, por sus siglas en inglés) como un estudio adyuvante para la detección oportuna del cáncer de mama. Su eficacia para detectar el cáncer de mama en etapas 1, 2, 3 y 4 es del 94 %; sin embargo, tiene limitaciones para diagnosticar cáncer en tumores menores de 1 cm, en mujeres con mamas con tejido graso abundante y en tumores de localización posterior. La mastografía térmica digital tiene una confiabilidad del 99 % en los primeros 12 meses; por esa razón se recomienda repetir el estudio anualmente.',
  references:
    'F. Gutiérrez-Delgado: Journal of Clinical Oncology 2009; 27(15S): 152. F. Gutiérrez-Delgado: US Radiology 2010; 2: 92-96. F. Gutiérrez-Delgado: US Oncological Review 2010; 6: 60-64. F. Gutiérrez-Delgado: US Obstetrics & Gynecology 2010; 5: 52-56.',
  contact: {
    address: 'Bugambilias 30, Fraccionamiento La Riviera, Juchitán, Oaxaca 70020',
    phone: '971 711 2014',
    web: 'www.ceprec.org',
    email: 'info@ceprec.org',
  },
} as const

/** Máximo de imágenes en la fila del informe (como en el formato de la clínica). */
export const REPORT_MAX_IMAGES = 4
