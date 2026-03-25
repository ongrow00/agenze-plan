import type { ScoreResult, Plan, PlanPhase, PlanWeek, PlanAula, PlanImpl, TaskType } from '@/types'
import { resolveLessonHref } from '@/lib/lessonUrl'

/** Normaliza o JSON do plano retornado pela Edge Function (mesma forma que o cliente esperava do Gemini). */
export function normalizePlanPayload(data: unknown, score: ScoreResult): Plan {
  const d = data as Record<string, unknown>

  const phases: PlanPhase[] = ((d.phases ?? []) as unknown[]).map((ph: unknown) => {
    const p = ph as Record<string, unknown>
    return {
      id: (p.id as string) ?? 'phase0',
      title: (p.title as string) ?? 'Fase',
      weeks: ((p.weeks ?? []) as unknown[]).map((w: unknown) => {
        const week = w as Record<string, unknown>
        const mapped: PlanWeek = {
          id: (week.id as string) ?? 'w1',
          title: (week.title as string) ?? 'Semana',
          goal: (week.goal as string) ?? '',
          revenue: week.revenue as string | undefined,
          aulas: ((week.aulas ?? []) as unknown[]).map((a: unknown) => {
            const x = a as Record<string, unknown>
            const raw = x.link as string | undefined
            const link = resolveLessonHref(raw) ?? undefined
            return {
              title: (x.title as string) ?? '',
              duration: (x.duration as string) ?? '45 min',
              link,
            } satisfies PlanAula
          }),
          impls: ((week.impls ?? []) as unknown[]).map((impl: unknown) => {
            const i = impl as Record<string, unknown>
            return {
              title: (i.title as string) ?? '',
              type: ((i.type as TaskType) ?? 'fazer') as TaskType,
              description: (i.description as string) ?? '',
              context: i.context as string | undefined,
            } satisfies PlanImpl
          }),
        }
        return mapped
      }),
    }
  })

  return {
    profileId: score.profileId,
    profileName: score.profileName,
    aulaCount:
      (d.aulaCount as number | undefined) ??
      phases.flatMap((p) => p.weeks).flatMap((w) => w.aulas).length,
    libraryLessonCount: d.libraryLessonCount as number | undefined,
    diagnosticText: (d.diagnosticText as string) ?? '',
    phases,
  }
}
