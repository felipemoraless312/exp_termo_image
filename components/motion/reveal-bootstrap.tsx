/**
 * Activa el modo de aparición antes del primer pintado (evita un parpadeo del contenido)
 * y lo anula si el navegador no ejecuta JavaScript, para que todo quede visible.
 */
export function RevealBootstrap() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('reveal-on')" }} />
      <noscript>
        <style>{'[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}'}</style>
      </noscript>
    </>
  )
}
