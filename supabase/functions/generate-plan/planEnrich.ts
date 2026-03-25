import type { Course } from './courses.ts'

export const FIRST_LESSON_LINK = 'https://app.agenze.io/c/veja-isso-antes-de-comecar/'
export const FIRST_LESSON_TITLE = 'Comece por aqui'

export function isVeryBeginner(score: { profileId: string }): boolean {
  return score.profileId === 'P0'
}

/** Aulas que entram em todo plano (inclui onboarding), exclui Pro. */
export function mandatoryCourses(courses: Course[]): Course[] {
  return courses.filter((c) => c.obrigatoria && !c.exclusivoPro)
}

/** Faixa de quantidade de aulas só eletivas para bater 35–72 aulas após o merge com obrigatórias. */
export function electiveBounds(courses: Course[]): { min: number; max: number } {
  const m = mandatoryCourses(courses).length
  return { min: Math.max(35 - m, 1), max: 72 - m }
}

/** Catálogo eletivo enviado ao modelo: sem Pro, sem obrigatórias, sem básicas para não-iniciantes. */
export function electiveCatalog(score: { profileId: string }, courses: Course[]): Course[] {
  const vb = isVeryBeginner(score)
  return courses.filter(
    (c) => !c.exclusivoPro && !c.obrigatoria && !(c.basica && !vb),
  )
}

function linkKey(link: string): string {
  return link.trim()
}

function iterWeeks(plan: Record<string, unknown>): Record<string, unknown>[] {
  const phases = plan.phases as Record<string, unknown>[] | undefined
  if (!Array.isArray(phases)) return []
  const out: Record<string, unknown>[] = []
  for (const ph of phases) {
    const weeks = (ph as Record<string, unknown>).weeks as Record<string, unknown>[] | undefined
    if (!Array.isArray(weeks)) continue
    out.push(...weeks)
  }
  return out
}

function totalAulas(plan: Record<string, unknown>): number {
  let n = 0
  for (const w of iterWeeks(plan)) {
    const aulas = w.aulas as unknown[] | undefined
    if (Array.isArray(aulas)) n += aulas.length
  }
  return n
}

function stripForbiddenAulas(plan: Record<string, unknown>, score: { profileId: string }, byLink: Map<string, Course>): void {
  const vb = isVeryBeginner(score)
  for (const w of iterWeeks(plan)) {
    const aulas = w.aulas as unknown[] | undefined
    if (!Array.isArray(aulas)) continue
    w.aulas = aulas.filter((a) => {
      const x = a as Record<string, unknown>
      const link = typeof x.link === 'string' ? linkKey(x.link) : ''
      if (!link) return false
      const c = byLink.get(link)
      if (!c) return false
      if (c.exclusivoPro) return false
      if (c.basica && !vb) return false
      return true
    })
  }
}

function dedupeAulasByLink(plan: Record<string, unknown>): void {
  const seen = new Set<string>()
  for (const w of iterWeeks(plan)) {
    const aulas = w.aulas as unknown[] | undefined
    if (!Array.isArray(aulas)) continue
    const next: unknown[] = []
    for (const a of aulas) {
      const x = a as Record<string, unknown>
      const link = typeof x.link === 'string' ? linkKey(x.link) : ''
      if (!link || seen.has(link)) continue
      seen.add(link)
      next.push(a)
    }
    w.aulas = next
  }
}

function removeLinkEverywhere(plan: Record<string, unknown>, target: string): void {
  const t = linkKey(target)
  for (const w of iterWeeks(plan)) {
    const aulas = w.aulas as unknown[] | undefined
    if (!Array.isArray(aulas)) continue
    w.aulas = aulas.filter((a) => {
      const x = a as Record<string, unknown>
      const link = typeof x.link === 'string' ? linkKey(x.link) : ''
      return link !== t
    })
  }
}

function ensureFirstLesson(plan: Record<string, unknown>, byLink: Map<string, Course>): void {
  const weeks = iterWeeks(plan)
  if (weeks.length === 0) return
  removeLinkEverywhere(plan, FIRST_LESSON_LINK)
  const first = weeks[0]
  const aulas = (first.aulas as unknown[]) ?? []
  const fc = byLink.get(FIRST_LESSON_LINK)
  const title = fc?.titulo ?? FIRST_LESSON_TITLE
  const duration = '45 min'
  first.aulas = [{ title, duration, link: FIRST_LESSON_LINK }, ...aulas]
}

function injectMissingMandatory(
  plan: Record<string, unknown>,
  orderedMandatory: Course[],
  byLink: Map<string, Course>,
): void {
  const present = new Set<string>()
  for (const w of iterWeeks(plan)) {
    const aulas = w.aulas as unknown[] | undefined
    if (!Array.isArray(aulas)) continue
    for (const a of aulas) {
      const x = a as Record<string, unknown>
      const link = typeof x.link === 'string' ? linkKey(x.link) : ''
      if (link) present.add(link)
    }
  }

  const missing = orderedMandatory.filter((c) => !present.has(linkKey(c.link)))
  if (missing.length === 0) return

  const weeks = iterWeeks(plan)
  if (weeks.length === 0) return

  for (const c of missing) {
    let bestIdx = 0
    let bestLen = Number.POSITIVE_INFINITY
    for (let i = 0; i < weeks.length; i++) {
      const aulas = (weeks[i].aulas as unknown[]) ?? []
      const len = Array.isArray(aulas) ? aulas.length : 0
      if (len < bestLen) {
        bestLen = len
        bestIdx = i
      }
    }
    const w = weeks[bestIdx]
    const aulas = (w.aulas as unknown[]) ?? []
    w.aulas = [
      ...aulas,
      {
        title: c.titulo,
        duration: '45 min',
        link: linkKey(c.link),
      },
    ]
  }
}

function trimToMax(
  plan: Record<string, unknown>,
  mandatorySet: Set<string>,
  maxTotal: number,
): void {
  let total = totalAulas(plan)
  if (total <= maxTotal) return

  const weeks = iterWeeks(plan)
  for (let wi = weeks.length - 1; wi >= 0 && total > maxTotal; wi--) {
    const w = weeks[wi]
    const aulas = w.aulas as unknown[] | undefined
    if (!Array.isArray(aulas)) continue
    for (let ai = aulas.length - 1; ai >= 0 && total > maxTotal; ai--) {
      const x = aulas[ai] as Record<string, unknown>
      const link = typeof x.link === 'string' ? linkKey(x.link) : ''
      if (link && mandatorySet.has(link)) continue
      aulas.splice(ai, 1)
      total--
    }
    w.aulas = aulas
  }
}

/**
 * Mescla regras de negócio no JSON do plano: remove Pro/básicas indevidas,
 * deduplica links, coloca "Comece por aqui" na primeira posição, injeta obrigatórias,
 * ajusta teto de aulas e `aulaCount` / `libraryLessonCount`.
 */
export function enrichPlan(plan: unknown, score: { profileId: string }, courses: Course[]): void {
  if (!plan || typeof plan !== 'object') return
  const p = plan as Record<string, unknown>

  const byLink = new Map<string, Course>()
  for (const c of courses) {
    byLink.set(linkKey(c.link), c)
  }

  const mand = mandatoryCourses(courses)
  const mandatorySet = new Set(mand.map((c) => linkKey(c.link)))

  stripForbiddenAulas(p, score, byLink)
  dedupeAulasByLink(p)
  injectMissingMandatory(p, mand, byLink)
  dedupeAulasByLink(p)
  ensureFirstLesson(p, byLink)

  trimToMax(p, mandatorySet, 72)

  const total = totalAulas(p)
  p.aulaCount = total
  p.libraryLessonCount = courses.length
}
