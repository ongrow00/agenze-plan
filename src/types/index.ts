export type ProfileId = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'

export type TaskType = 'criar' | 'fazer' | 'rotina' | 'testar' | 'marco'

export interface Contact {
  name: string
  email: string
  phone: string
}

export interface QuizAnswers {
  [questionId: string]: number // index of selected option (0-based)
}

export interface DimensionScore {
  situacao: number   // 0-100 — situação atual (ponto de partida)
  tecnico: number    // 0-100
  comercial: number  // 0-100
  copy: number       // 0-100
  operacao: number | null // null se não tem clientes
}

export interface ScoreResult {
  dimensions: DimensionScore
  profileId: ProfileId
  profileName: string
  faturamento: number     // index da opção de P5
  clientes: number        // index da opção de P6
  tempoMercado: number    // index da opção de P8
  horasDisponiveis: number // index da opção de P28
  objetivo: string
  nicho: string
  mainBlock: string       // principal gargalo identificado
}

// ─── Plan structures ──────────────────────────────────────────

export interface PlanAula {
  title: string
  duration: string // "45 min"
  link?: string
  platform?: string
}

export interface PlanImpl {
  title: string
  type: TaskType
  description: string
  context?: string // nota de contexto opcional
}

export interface PlanWeek {
  id: string         // "w1", "w2" …
  title: string
  goal: string       // objetivo da semana
  revenue?: string   // faturamento esperado
  aulas: PlanAula[]
  impls: PlanImpl[]
}

export interface PlanPhase {
  id: string
  title: string
  weeks: PlanWeek[]
}

export interface Plan {
  profileId: ProfileId
  profileName: string
  aulaCount: number
  /** Total de aulas na biblioteca Agenze (inclui Pro); definido na geração do plano. */
  libraryLessonCount?: number
  phases: PlanPhase[]
  diagnosticText: string
}

// ─── Progress state ───────────────────────────────────────────

export interface ProgressState {
  planId: string
  /** FK em `plans` / `plan_progress`; necessário para upsert no Supabase */
  leadId?: string
  email: string
  phone?: string
  profileId: ProfileId
  checkedAulas: Record<string, number[]>  // weekId → [aulaIndex, …]
  checkedImpls: Record<string, number[]>  // weekId → [implIndex, …]
  lastSeen: string
}

// ─── App state ────────────────────────────────────────────────

export type AppStep = 'welcome' | 'contact' | 'quiz' | 'generating' | 'result'

export interface QuizState {
  step: AppStep
  currentQuestion: number  // 0-29
  contact: Contact
  answers: QuizAnswers
  score: ScoreResult | null
  planId: string | null    // UUID gerado ao concluir o quiz
  /** lead_id do Supabase após gerar o plano (para persistir progresso) */
  leadId: string | null
  isGoingBack: boolean
}
