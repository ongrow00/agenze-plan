import { getVisibleQuestions } from '@/data/questions'
import type { QuizAnswers } from '@/types'

/** Texto legível das respostas (para o prompt da IA). Inclui só perguntas respondidas. */
export function formatAnswersSummary(answers: QuizAnswers): string {
  const visible = getVisibleQuestions(answers)
  const lines: string[] = []

  for (const q of visible) {
    const idx = answers[q.id]
    if (idx === undefined) continue
    const opt = q.options?.[idx]
    const label = opt ?? `(opção ${idx + 1})`
    lines.push(`- **${q.blockLabel}** — ${q.text} → ${label}`)
  }

  if (lines.length === 0) {
    return '(Nenhuma resposta detalhada — use apenas o score.)'
  }

  return lines.join('\n')
}
