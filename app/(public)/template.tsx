/** Se vuelve a montar en cada navegación: da una entrada suave a cada página del sitio. */
export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>
}
