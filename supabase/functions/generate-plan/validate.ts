/** Validação pós-geração: links permitidos e faixa de total de aulas. */

const SECTION_LESSON_RE = /\/sections\/(\d+)\/lessons\/(\d+)/

/** Mapeia sectionId/lessonId → URL canônica do catálogo (ignora slug do curso). */
export function buildLessonKeyToCanonicalMap(courses: readonly { link: string }[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const c of courses) {
    const trimmed = c.link.trim()
    const m = trimmed.match(SECTION_LESSON_RE)
    if (m) map.set(`${m[1]}/${m[2]}`, trimmed)
  }
  return map
}

/** Substitui links que apontam para a mesma aula (mesmo section/lesson) pelo URL do catálogo. */
export function normalizePlanLinks(
  plan: unknown,
  lessonKeyToCanonical: Map<string, string>,
): void {
  if (!plan || typeof plan !== 'object') return
  const p = plan as Record<string, unknown>
  const phases = p.phases as unknown[] | undefined
  if (!Array.isArray(phases)) return
  for (const ph of phases) {
    const phase = ph as Record<string, unknown>
    const weeks = phase.weeks as unknown[] | undefined
    if (!Array.isArray(weeks)) continue
    for (const w of weeks) {
      const week = w as Record<string, unknown>
      const aulas = week.aulas as unknown[] | undefined
      if (!Array.isArray(aulas)) continue
      for (const a of aulas) {
        const aula = a as Record<string, unknown>
        const link = typeof aula.link === 'string' ? aula.link.trim() : ''
        if (!link) continue
        const m = link.match(SECTION_LESSON_RE)
        if (!m) continue
        const canonical = lessonKeyToCanonical.get(`${m[1]}/${m[2]}`)
        if (canonical) aula.link = canonical
      }
    }
  }
}

export function validatePlan(
  plan: unknown,
  allowedLinks: Set<string>,
): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (!plan || typeof plan !== 'object') {
    return { ok: false, errors: ['Plano inválido ou vazio'] }
  }

  const p = plan as Record<string, unknown>
  const phases = p.phases as unknown[] | undefined
  if (!Array.isArray(phases) || phases.length === 0) {
    errors.push('Nenhuma fase no plano')
    return { ok: false, errors }
  }

  let totalAulas = 0
  for (const ph of phases) {
    const phase = ph as Record<string, unknown>
    const weeks = phase.weeks as unknown[] | undefined
    if (!Array.isArray(weeks)) continue
    for (const w of weeks) {
      const week = w as Record<string, unknown>
      const aulas = week.aulas as unknown[] | undefined
      if (!Array.isArray(aulas)) continue
      totalAulas += aulas.length
      for (const a of aulas) {
        const aula = a as Record<string, unknown>
        const link = typeof aula.link === 'string' ? aula.link.trim() : ''
        if (link && !allowedLinks.has(link)) {
          errors.push(`Link não está no catálogo: ${link.slice(0, 72)}${link.length > 72 ? '…' : ''}`)
        }
      }
    }
  }

  if (totalAulas < 35 || totalAulas > 72) {
    errors.push(`Total de aulas (${totalAulas}) fora da faixa aceitável (35–72).`)
  }

  return { ok: errors.length === 0, errors }
}

export function buildAllowedLinkSet(links: readonly string[]): Set<string> {
  return new Set(links.map((l) => l.trim()))
}
