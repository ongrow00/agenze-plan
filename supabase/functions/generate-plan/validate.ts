/** Validação pós-geração: links permitidos e faixa de total de aulas. */

import type { Course } from './courses.ts'
import { FIRST_LESSON_LINK, mandatoryCourses } from './planEnrich.ts'

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

export function buildAllowedLinkSet(links: readonly string[]): Set<string> {
  return new Set(links.map((l) => l.trim()))
}

/** Valida só a parte eletiva gerada pela IA (antes do enrich). */
export function validateAiPlan(
  plan: unknown,
  allowedElectiveLinks: Set<string>,
  electiveMin: number,
  electiveMax: number,
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

  let electiveCount = 0
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
        if (!link) {
          errors.push('Aula sem link')
          continue
        }
        if (!allowedElectiveLinks.has(link)) {
          errors.push(
            `Link eletivo inválido ou fora do catálogo eletivo: ${link.slice(0, 72)}${link.length > 72 ? '…' : ''}`,
          )
        } else {
          electiveCount++
        }
      }
    }
  }

  if (electiveCount < electiveMin || electiveCount > electiveMax) {
    errors.push(
      `Quantidade de aulas eletivas (${electiveCount}) fora da faixa (${electiveMin}–${electiveMax}).`,
    )
  }

  return { ok: errors.length === 0, errors }
}

/** Validação após enrich: links não-Pro, obrigatórias presentes, primeira aula fixa, total 35–72. */
export function validateEnrichedPlan(plan: unknown, courses: Course[]): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  if (!plan || typeof plan !== 'object') {
    return { ok: false, errors: ['Plano inválido ou vazio'] }
  }

  const allowed = buildAllowedLinkSet(courses.filter((c) => !c.exclusivoPro).map((c) => c.link))
  const mand = mandatoryCourses(courses)
  const mandSet = new Set(mand.map((c) => c.link.trim()))

  const p = plan as Record<string, unknown>
  const phases = p.phases as unknown[] | undefined
  if (!Array.isArray(phases) || phases.length === 0) {
    errors.push('Nenhuma fase no plano')
    return { ok: false, errors }
  }

  const present = new Set<string>()
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
        if (link) {
          present.add(link)
          if (!allowed.has(link)) {
            errors.push(`Link não permitido no plano: ${link.slice(0, 72)}${link.length > 72 ? '…' : ''}`)
          }
        }
      }
    }
  }

  for (const m of mand) {
    const k = m.link.trim()
    if (!present.has(k)) {
      errors.push(`Aula obrigatória ausente: ${m.titulo}`)
    }
  }

  const firstWeek = (phases[0] as Record<string, unknown>).weeks as unknown[] | undefined
  const w0 = Array.isArray(firstWeek) && firstWeek.length > 0 ? (firstWeek[0] as Record<string, unknown>) : null
  const a0 = w0 && Array.isArray(w0.aulas) && w0.aulas.length > 0 ? (w0.aulas[0] as Record<string, unknown>) : null
  const firstLink = a0 && typeof a0.link === 'string' ? a0.link.trim() : ''
  if (firstLink !== FIRST_LESSON_LINK) {
    errors.push('A primeira aula da primeira semana deve ser "Comece por aqui" (onboarding).')
  }

  if (totalAulas < 35 || totalAulas > 72) {
    errors.push(`Total de aulas (${totalAulas}) fora da faixa aceitável (35–72).`)
  }

  return { ok: errors.length === 0, errors }
}
