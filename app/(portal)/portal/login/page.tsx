import { redirect } from 'next/navigation'

/** El inicio de sesión es uno solo, en la página principal. */
export default function PatientLoginPage() {
  redirect('/')
}
