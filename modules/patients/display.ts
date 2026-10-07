import type { Address, Contact } from './types'

/** Textos de la ficha de identificación que pueden quedar incompletos (p. ej. pacientes del preregistro de una campaña). */

export const pendingLabel = 'Pendiente de registrar'

export function formatAddress(address: Address): string {
  if (!address.street) return pendingLabel
  return [address.street, address.neighborhood && `col. ${address.neighborhood}`, address.municipality, address.state, address.zip && `C.P. ${address.zip}`].filter(Boolean).join(', ')
}

export function formatContact(contact: Contact): string {
  if (!contact.name) return pendingLabel
  return `${contact.name}${contact.relationship ? ` (${contact.relationship})` : ''}${contact.phone ? ` · ${contact.phone}` : ''}`
}

export function insuranceLabel(insurance: { type: string; policy?: string }): string {
  return insurance.type ? `${insurance.type}${insurance.policy ? ` · ${insurance.policy}` : ''}` : 'Sin afiliación registrada'
}
