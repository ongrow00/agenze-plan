/** Origem do app de aulas; paths relativos `/c/...` devem apontar aqui, não ao domínio do Plano10k. */
export const AGENZE_APP_ORIGIN = 'https://app.agenze.io'

/**
 * Garante URL absoluta para a aula. Paths como `/c/...` no JSON viram link no domínio atual
 * e o React Router redireciona `*` → `/` (home). Sempre devolve https://app.agenze.io/...
 */
export function resolveLessonHref(raw: string | undefined): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s || s === '#' || s === '/') return null

  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).href
    } catch {
      return null
    }
  }

  if (s.startsWith('//')) {
    try {
      return new URL(`https:${s}`).href
    } catch {
      return null
    }
  }

  const path = s.startsWith('/') ? s : `/${s}`
  if (path.startsWith('/c/')) {
    return `${AGENZE_APP_ORIGIN}${path}`
  }

  return null
}
