import type { QuizAnswers, ScoreResult, DimensionScore, ProfileId } from '@/types'

// Score values por opção (0-based index → score 0-100)
const SCORE_MAP: Record<string, number[]> = {
  // Técnico
  q10: [0, 25, 60, 100],
  q11: [0, 20, 60, 100],
  q12: [0, 15, 50, 100],
  q14: [0, 20, 70, 100],
  q15: [0, 20, 60, 100],
  // Copy & IA
  q16: [0, 25, 60, 100],
  q17: [0, 15, 55, 100],
  // Comercial
  q18: [0, 20, 65, 100],
  q19: [20, 40, 70, 90, 0],  // "ainda não sei" = 0
  q20: [0, 25, 65, 100],
  q21: [0, 30, 65, 100],
  q22: [0, 15, 50, 100],
  q23: [5, 15, 40, 75, 100],
  // Operação
  q24: [0, 40, 100],
  q25: [0, 50, 100],
  q26: [0, 30, 100],
  q27: [0, 20, 50, 100],
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

function scoreFor(questionId: string, answers: QuizAnswers): number | null {
  const answer = answers[questionId]
  if (answer === undefined) return null
  const map = SCORE_MAP[questionId]
  if (!map) return null
  return map[answer] ?? 0
}

export function calculateScore(answers: QuizAnswers): ScoreResult {
  const hasClients = (answers['q6'] ?? 0) >= 1

  // Técnico
  const tecnicoScores = ['q10', 'q11', 'q12', 'q14', 'q15']
    .map((id) => scoreFor(id, answers))
    .filter((v): v is number => v !== null)

  // Copy
  const copyScores = ['q16', 'q17']
    .map((id) => scoreFor(id, answers))
    .filter((v): v is number => v !== null)

  // Comercial
  const comercialScores = ['q18', 'q19', 'q20', 'q21', 'q22', 'q23']
    .map((id) => scoreFor(id, answers))
    .filter((v): v is number => v !== null)

  // Operação (só para quem tem clientes)
  let operacaoScore: number | null = null
  if (hasClients) {
    const opScores = ['q24', 'q25', 'q26', 'q27']
      .map((id) => scoreFor(id, answers))
      .filter((v): v is number => v !== null)
    if (opScores.length > 0) operacaoScore = avg(opScores)
  }

  const dimensions: DimensionScore = {
    situacao: calcSituacao(answers),
    tecnico: avg(tecnicoScores),
    comercial: avg(comercialScores),
    copy: avg(copyScores),
    operacao: operacaoScore,
  }

  const profileId = classifyProfile(answers, dimensions)
  const profileName = PROFILE_NAMES[profileId]
  const mainBlock = findMainBlock(dimensions)

  const OBJECTIVES: string[] = [
    'Fechar meu primeiro cliente',
    'Chegar a R$5.000/mês',
    'Chegar a R$10.000/mês',
    'Estruturar a agência e contratar',
    'Escalar para R$30k+/mês',
  ]

  const NICHOS: string[] = [
    'Ainda não definido',
    'Qualquer nicho',
    'Negócios locais',
    'Infoprodutos e lançamentos',
    'E-commerce',
    'Serviços B2B',
  ]

  return {
    dimensions,
    profileId,
    profileName,
    faturamento: answers['q5'] ?? 0,
    clientes: answers['q6'] ?? 0,
    tempoMercado: answers['q8'] ?? 0,
    horasDisponiveis: answers['q28'] ?? 0,
    objetivo: OBJECTIVES[answers['q9'] ?? 0] ?? OBJECTIVES[0],
    nicho: NICHOS[answers['q29'] ?? 0] ?? NICHOS[0],
    mainBlock,
  }
}

function calcSituacao(answers: QuizAnswers): number {
  const fat = (answers['q5'] ?? 0) * 20     // 0-80
  const cli = Math.min((answers['q6'] ?? 0) * 15, 60)  // 0-60
  const tempo = (answers['q8'] ?? 0) * 10   // 0-40
  return Math.min(Math.round((fat + cli + tempo) / 3), 100)
}

function classifyProfile(answers: QuizAnswers, dim: DimensionScore): ProfileId {
  const fat = answers['q5'] ?? 0
  const cli = answers['q6'] ?? 0
  const tempo = answers['q8'] ?? 0

  if (fat >= 4 || (cli >= 4 && dim.tecnico >= 60)) return 'P5'
  if (fat === 3 || cli >= 3) return 'P4'
  if (fat === 2 || (cli >= 1 && cli <= 2)) return 'P3'
  if (fat === 0 && dim.tecnico >= 40 && dim.comercial < 30) return 'P1'
  if (fat === 0 && cli === 0 && tempo >= 2) return 'P2'
  return 'P0'
}

function findMainBlock(dim: DimensionScore): string {
  const scores: [string, number][] = [
    ['Técnico', dim.tecnico],
    ['Comercial', dim.comercial],
    ['Copy & Criativo', dim.copy],
  ]
  if (dim.operacao !== null) scores.push(['Operação', dim.operacao])
  scores.sort((a, b) => a[1] - b[1])
  return scores[0][0]
}

export const PROFILE_NAMES: Record<ProfileId, string> = {
  P0: 'Iniciante Absoluto',
  P1: 'Iniciante com Base Técnica',
  P2: 'Praticante Travado',
  P3: 'Em Operação Inicial',
  P4: 'Crescendo',
  P5: 'Escala',
}

export const DIMENSION_LABELS: Record<keyof DimensionScore, string> = {
  situacao: 'Níveis de experiência',
  tecnico: 'Técnico',
  comercial: 'Comercial',
  copy: 'Copy & Criativo',
  operacao: 'Operação',
}

export const DIMENSION_COLORS: Record<keyof DimensionScore, string> = {
  situacao: 'var(--dim-situacao)',
  tecnico: 'var(--dim-tecnico)',
  comercial: 'var(--dim-comercial)',
  copy: 'var(--dim-copy)',
  operacao: 'var(--dim-operacao)',
}
