import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppStep, Contact, QuizAnswers, ScoreResult, ProgressState, ProfileId, Plan } from '@/types'
import { calculateScore } from '@/data/scoring'
import { getVisibleQuestions } from '@/data/questions'
import { supabase } from '@/lib/supabase'
import { normalizePlanPayload } from '@/lib/plan'
import { formatAnswersSummary } from '@/lib/answersSummary'

interface QuizStore {
  // ─── Navigation ───────────────────────────────────────────────
  step: AppStep
  currentQuestion: number
  isGoingBack: boolean
  generatingStep: number
  generatingError: string | null
  isSubmitting: boolean

  // ─── Data ─────────────────────────────────────────────────────
  contact: Contact
  answers: QuizAnswers
  score: ScoreResult | null
  planId: string | null
  leadId: string | null
  plan: Plan | null

  // ─── Actions ──────────────────────────────────────────────────
  setStep: (step: AppStep) => void
  setContact: (contact: Contact) => void
  setAnswer: (questionId: string, optionIndex: number) => void
  nextQuestion: () => void
  prevQuestion: () => void
  submitQuiz: () => Promise<void>
  retrySubmit: () => void
  cancelGenerating: () => void
  reset: () => void
}

interface ProgressStore {
  progresses: Record<string, ProgressState> // planId → progress

  initProgress: (planId: string, email: string, profileId: ProfileId, phone?: string, leadId?: string) => void
  toggleAula: (planId: string, weekId: string, index: number) => void
  toggleImpl: (planId: string, weekId: string, index: number) => void
  getProgress: (planId: string) => ProgressState | undefined

  // Supabase sync
  syncProgress: (planId: string) => Promise<void>
  loadProgress: (planId: string) => Promise<void>
}

function generateId(): string {
  return crypto.randomUUID()
}

const initialQuizState = {
  step: 'welcome' as AppStep,
  currentQuestion: 0,
  isGoingBack: false,
  generatingStep: 0,
  generatingError: null as string | null,
  isSubmitting: false,
  contact: { name: '', email: '', phone: '' },
  answers: {},
  score: null,
  planId: null,
  leadId: null,
  plan: null,
}

let activeSubmitSeq = 0

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      ...initialQuizState,

      setStep: (step) => set({ step }),

      setContact: (contact) => set({ contact }),

      setAnswer: (questionId, optionIndex) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: optionIndex },
        })),

      nextQuestion: () => {
        const state = get()
        const visible = getVisibleQuestions(state.answers)
        if (state.currentQuestion < visible.length - 1) {
          set({ currentQuestion: state.currentQuestion + 1, isGoingBack: false })
        } else {
          // Last question — start async submit
          state.submitQuiz()
        }
      },

      prevQuestion: () => {
        const state = get()
        if (state.currentQuestion > 0) {
          set({ currentQuestion: state.currentQuestion - 1, isGoingBack: true })
        } else {
          set({ step: 'contact', isGoingBack: true })
        }
      },

      submitQuiz: async () => {
        const submitSeq = ++activeSubmitSeq
        const state = get()
        const score = calculateScore(state.answers)
        const planId = generateId()

        set({ score, planId, step: 'generating', generatingStep: 0, generatingError: null })
        set({ isSubmitting: true })

          try {
          set({ generatingStep: 1 })

          set({ generatingStep: 2 })
          const { data: fnData, error: fnError } = await supabase.functions.invoke<{
            plan?: unknown
            planId?: string
            leadId?: string
            error?: string
          }>('generate-plan', {
            body: {
              contact: state.contact,
              score,
              planId,
              answers: state.answers,
              answersSummary: formatAnswersSummary(state.answers),
            },
          })

          if (fnError) {
            let detail = fnError.message
            if (
              typeof fnError === 'object' &&
              fnError !== null &&
              'context' in fnError &&
              fnError.context instanceof Response
            ) {
              try {
                const body = await fnError.context.clone().json()
                if (body && typeof body.error === 'string') detail = body.error
              } catch {
                /* ignore */
              }
            }
            throw new Error(detail)
          }

          if (submitSeq !== activeSubmitSeq || get().step !== 'generating') return

          if (!fnData?.plan) {
            throw new Error(fnData?.error ?? 'Resposta inválida da função generate-plan')
          }

          const plan = normalizePlanPayload(fnData.plan, score)

          const leadId = typeof fnData.leadId === 'string' ? fnData.leadId : null

          set({ generatingStep: 5 })
          set({ plan, step: 'result', leadId })

          const { initProgress } = useProgressStore.getState()
          initProgress(planId, state.contact.email, score.profileId, state.contact.phone, leadId ?? undefined)
          if (submitSeq === activeSubmitSeq) set({ isSubmitting: false })

        } catch (err) {
          if (submitSeq !== activeSubmitSeq || get().step !== 'generating') return
          const msg = err instanceof Error ? err.message : 'Erro desconhecido'
          console.error('submitQuiz error:', msg)
          set({ generatingError: msg, isSubmitting: false })
        }
      },

      retrySubmit: () => {
        const state = get()
        set({ generatingError: null, generatingStep: 0 })
        state.submitQuiz()
      },

      cancelGenerating: () => {
        activeSubmitSeq += 1
        set({ step: 'welcome', generatingError: null, generatingStep: 0, isSubmitting: false })
      },

      reset: () => set(initialQuizState),
    }),
    {
      name: 'agenze-quiz',
      partialize: (state) => ({
        contact: state.contact,
        answers: state.answers,
        planId: state.planId,
        leadId: state.leadId,
        score: state.score,
        plan: state.plan,
        // Never persist an in-flight status to avoid locking users on refresh.
        step: state.step === 'generating' ? 'welcome' : state.step,
      }),
    }
  )
)

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      progresses: {},

      initProgress: (planId, email, profileId, phone, leadId) => {
        set((state) => {
          const existing = state.progresses[planId]
          if (existing) {
            if (leadId && !existing.leadId) {
              return {
                progresses: {
                  ...state.progresses,
                  [planId]: { ...existing, leadId },
                },
              }
            }
            return state
          }
          return {
            progresses: {
              ...state.progresses,
              [planId]: {
                planId,
                ...(leadId ? { leadId } : {}),
                email,
                phone,
                profileId,
                checkedAulas: {},
                checkedImpls: {},
                lastSeen: new Date().toISOString(),
              },
            },
          }
        })
      },

      toggleAula: (planId, weekId, index) => {
        set((state) => {
          const progress = state.progresses[planId]
          if (!progress) return state
          const current = progress.checkedAulas[weekId] ?? []
          const updated = current.includes(index)
            ? current.filter((i) => i !== index)
            : [...current, index]
          return {
            progresses: {
              ...state.progresses,
              [planId]: {
                ...progress,
                checkedAulas: { ...progress.checkedAulas, [weekId]: updated },
                lastSeen: new Date().toISOString(),
              },
            },
          }
        })
        // Sync async (fire-and-forget)
        get().syncProgress(planId)
      },

      toggleImpl: (planId, weekId, index) => {
        set((state) => {
          const progress = state.progresses[planId]
          if (!progress) return state
          const current = progress.checkedImpls[weekId] ?? []
          const updated = current.includes(index)
            ? current.filter((i) => i !== index)
            : [...current, index]
          return {
            progresses: {
              ...state.progresses,
              [planId]: {
                ...progress,
                checkedImpls: { ...progress.checkedImpls, [weekId]: updated },
                lastSeen: new Date().toISOString(),
              },
            },
          }
        })
        get().syncProgress(planId)
      },

      getProgress: (planId) => get().progresses[planId],

      syncProgress: async (planId) => {
        const progress = get().progresses[planId]
        if (!progress) return

        let leadId = progress.leadId
        if (!leadId) {
          const { data: planRow } = await supabase.from('plans').select('lead_id').eq('id', planId).maybeSingle()
          leadId = planRow?.lead_id as string | undefined
          if (leadId) {
            set((state) => {
              const p = state.progresses[planId]
              if (!p) return state
              return {
                progresses: {
                  ...state.progresses,
                  [planId]: { ...p, leadId },
                },
              }
            })
          }
        }
        if (!leadId) return

        const { error } = await supabase.from('plan_progress').upsert(
          {
            plan_id: planId,
            lead_id: leadId,
            checked_aulas: progress.checkedAulas,
            checked_impls: progress.checkedImpls,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'plan_id' },
        )
        if (error) console.error('syncProgress', error)
      },

      loadProgress: async (planId) => {
        const { data: progRow } = await supabase
          .from('plan_progress')
          .select('checked_aulas, checked_impls, lead_id')
          .eq('plan_id', planId)
          .maybeSingle()

        const { data: planRow } = await supabase.from('plans').select('lead_id').eq('id', planId).maybeSingle()
        const leadId =
          (progRow?.lead_id as string | undefined) ?? (planRow?.lead_id as string | undefined)
        if (!leadId) return

        const { data: lead } = await supabase
          .from('leads')
          .select('email, phone, profile_id')
          .eq('id', leadId)
          .maybeSingle()

        if (!lead) return

        const checkedAulas = (progRow?.checked_aulas as Record<string, number[]>) ?? {}
        const checkedImpls = (progRow?.checked_impls as Record<string, number[]>) ?? {}

        set((state) => ({
          progresses: {
            ...state.progresses,
            [planId]: {
              planId,
              leadId,
              email: lead.email as string,
              phone: lead.phone as string | undefined,
              profileId: lead.profile_id as ProfileId,
              checkedAulas,
              checkedImpls,
              lastSeen: new Date().toISOString(),
            },
          },
        }))
      },
    }),
    { name: 'agenze-progress' }
  )
)
