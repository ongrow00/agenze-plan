import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button, Text, Heading, Flex, Box, Badge, Card, Grid,
  Callout, Separator, Spinner, AlertDialog, Tooltip, IconButton,
} from '@radix-ui/themes'
import {
  CopyIcon, CheckIcon, ChevronDownIcon,
  BookmarkIcon, LightningBoltIcon, ExternalLinkIcon,
} from '@radix-ui/react-icons'
import { Dock } from '@/components/ui/dock-two'
import * as Accordion from '@radix-ui/react-accordion'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Toast from '@radix-ui/react-toast'
import { Rss, BookOpen, Bot, Workflow, LogOut, Sparkles } from 'lucide-react'
import { useQuizStore, useProgressStore } from '@/store/quizStore'
import { supabase } from '@/lib/supabase'
import { DIMENSION_LABELS, DIMENSION_COLORS, calculateScore } from '@/data/scoring'
import { ProgressBar, DualProgress } from '@/components/ui/ProgressBar'
import { TaskBadge } from '@/components/ui/Badge'
import { Navbar } from '@/components/layout/Navbar'
import type { DimensionScore, Plan, PlanPhase, PlanWeek, QuizAnswers, ScoreResult } from '@/types'

/** Reconstrói o score a partir do lead no Supabase (quando o quizStore foi limpo ao sair do plano). */
function buildScoreFromLead(
  lead: { answers?: unknown; score?: unknown; objetivo?: string | null; nicho?: string | null },
  plan: Plan,
): { score: ScoreResult; partial: boolean } | null {
  const answers = lead.answers as QuizAnswers
  if (answers && typeof answers === 'object' && Object.keys(answers).length > 0) {
    return { score: calculateScore(answers), partial: false }
  }
  const dim = lead.score as DimensionScore | undefined
  if (dim && typeof dim === 'object' && typeof dim.situacao === 'number') {
    return {
      partial: true,
      score: {
        dimensions: dim,
        profileId: plan.profileId,
        profileName: plan.profileName,
        faturamento: 0,
        clientes: 0,
        tempoMercado: 0,
        horasDisponiveis: 0,
        objetivo: lead.objetivo ?? '',
        nicho: lead.nicho ?? '',
        mainBlock: '',
      },
    }
  }
  return null
}

// ─── KPI Card ──────────────────────────────────────────────────
function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card size="2" variant="surface">
      <Text
        size="1"
        style={{ fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-9)', display: 'block', marginBottom: 4 }}
      >
        {label}
      </Text>
      <Heading size="5" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--gray-12)' }}>
        {value}
      </Heading>
      {sub && <Text size="1" color="gray">{sub}</Text>}
    </Card>
  )
}

// ─── Score bars ─────────────────────────────────────────────────
function ScoreBars({ dimensions }: { dimensions: DimensionScore }) {
  const entries = Object.entries(dimensions) as [keyof DimensionScore, number | null][]
  return (
    <Card size="3" variant="surface">
      <Heading size="3" mb="4" style={{ fontFamily: 'Inter, sans-serif' }}>Score por dimensão</Heading>
      <Flex direction="column" gap="4">
        {entries.map(([key, val], i) => {
          if (val === null) return null
          return (
            <div key={key} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <ProgressBar value={val} label={DIMENSION_LABELS[key]} color={DIMENSION_COLORS[key]} animated />
            </div>
          )
        })}
      </Flex>
    </Card>
  )
}

// ─── Week block ─────────────────────────────────────────────────
function WeekBlock({ week, planId, phaseIndex, weekIndex }: { week: PlanWeek; planId: string; phaseIndex: number; weekIndex: number }) {
  const { toggleAula, toggleImpl, getProgress } = useProgressStore()
  const progress = getProgress(planId)
  const checkedAulas = progress?.checkedAulas[week.id] ?? []
  const checkedImpls = progress?.checkedImpls[week.id] ?? []
  const [pop, setPop] = useState(false)

  const totalItems = week.aulas.length + week.impls.length
  const doneItems = checkedAulas.length + checkedImpls.length

  useEffect(() => {
    if (doneItems === totalItems && totalItems > 0) {
      setPop(true)
      setTimeout(() => setPop(false), 400)
    }
  }, [doneItems, totalItems])

  const weekComplete = doneItems === totalItems && totalItems > 0

  return (
    <Accordion.Item value={`p${phaseIndex}-w${weekIndex}`} style={{ marginBottom: 8 }}>
      <Accordion.Trigger asChild>
        <Box
          p="3"
          style={{
            borderRadius: 'var(--radius-3)',
            border: '1px solid var(--gray-4)',
            background: 'var(--gray-2)',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <Flex align="center" justify="between" gap="3">
            <Flex direction="column" gap="2" style={{ flex: 1, minWidth: 0 }}>
              <Flex align="center" gap="2" wrap="wrap">
                <Text size="2" weight="medium" className={pop ? 'animate-pop' : ''} style={{ fontFamily: 'Inter, sans-serif' }}>
                  {week.title}
                </Text>
                {weekComplete && (
                  <Badge size="1" color="green" variant="soft">Concluída ✓</Badge>
                )}
              </Flex>
              <DualProgress
                aulasDone={checkedAulas.length}
                aulasTotal={week.aulas.length}
                implsDone={checkedImpls.length}
                implsTotal={week.impls.length}
              />
            </Flex>
            <ChevronDownIcon
              style={{ flexShrink: 0, color: 'var(--gray-8)', transition: 'transform 0.2s' }}
              className="accordion-chevron"
            />
          </Flex>
        </Box>
      </Accordion.Trigger>

      <Accordion.Content className="animate-fade-up">
        <Card mt="2" size="3" variant="surface">
          {/* Goal */}
          <Text size="2" color="gray" mb="4" style={{ display: 'block' }}>
            <Text weight="bold" style={{ color: 'var(--gray-12)' }}>Meta:</Text> {week.goal}
            {week.revenue && (
              <Text style={{ color: 'var(--accent-9)', fontFamily: 'Inter, sans-serif', fontSize: 12, marginLeft: 8 }}>
                · {week.revenue}
              </Text>
            )}
          </Text>

          {/* Aulas */}
          {week.aulas.length > 0 && (
            <Box mb="5">
              <Flex align="center" gap="2" mb="3">
                <BookmarkIcon style={{ color: 'var(--dim-situacao)' }} />
                <Text size="1" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dim-situacao)', fontFamily: 'Inter, sans-serif' }}>
                  Aulas da semana
                </Text>
              </Flex>
              <Flex direction="column" gap="2">
                {week.aulas.map((aula, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-2)',
                      background: 'var(--gray-2)',
                      cursor: 'pointer',
                    }}
                  >
                    <Checkbox.Root
                      checked={checkedAulas.includes(i)}
                      onCheckedChange={() => toggleAula(planId, week.id, i)}
                      style={{
                        flexShrink: 0,
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: `1.5px solid ${checkedAulas.includes(i) ? 'var(--dim-situacao)' : 'var(--gray-6)'}`,
                        background: checkedAulas.includes(i) ? 'var(--dim-situacao)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Checkbox.Indicator>
                        <CheckIcon style={{ color: '#fff', width: 10, height: 10 }} />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    <Flex style={{ flex: 1, minWidth: 0 }} align="center" gap="2">
                      <Text
                        size="2"
                        style={{
                          flex: 1,
                          color: 'var(--gray-12)',
                          textDecoration: checkedAulas.includes(i) ? 'line-through' : 'none',
                          opacity: checkedAulas.includes(i) ? 0.5 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        {aula.title}
                      </Text>
                    </Flex>
                    {aula.link ? (
                      <Text
                        size="1"
                        weight="bold"
                        asChild
                        style={{ flexShrink: 0, fontFamily: 'Inter, sans-serif' }}
                      >
                        <a
                          href={aula.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            color: 'var(--violet-11)',
                          }}
                        >
                          Ver aula
                          <ExternalLinkIcon
                            width={12}
                            height={12}
                            aria-hidden
                            style={{ flexShrink: 0, color: 'inherit' }}
                          />
                        </a>
                      </Text>
                    ) : (
                      <Text
                        size="1"
                        weight="bold"
                        style={{
                          flexShrink: 0,
                          fontFamily: 'Inter, sans-serif',
                          color: 'var(--violet-11)',
                        }}
                      >
                        Ver aula
                      </Text>
                    )}
                  </label>
                ))}
              </Flex>
            </Box>
          )}

          {/* Implementações */}
          {week.impls.length > 0 && (
            <Box>
              <Flex align="center" gap="2" mb="3">
                <LightningBoltIcon style={{ color: 'var(--dim-tecnico)' }} />
                <Text size="1" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dim-tecnico)', fontFamily: 'Inter, sans-serif' }}>
                  Implementações
                </Text>
              </Flex>
              <Flex direction="column" gap="2">
                {week.impls.map((impl, i) => (
                  <Card key={i} size="2" variant="surface">
                    <Flex gap="3" align="start">
                      <Checkbox.Root
                        checked={checkedImpls.includes(i)}
                        onCheckedChange={() => toggleImpl(planId, week.id, i)}
                        style={{
                          flexShrink: 0,
                          marginTop: 2,
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: `1.5px solid ${checkedImpls.includes(i) ? 'var(--dim-tecnico)' : 'var(--gray-6)'}`,
                          background: checkedImpls.includes(i) ? 'var(--dim-tecnico)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Checkbox.Indicator>
                          <CheckIcon style={{ color: '#fff', width: 10, height: 10 }} />
                        </Checkbox.Indicator>
                      </Checkbox.Root>

                      <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
                        <Flex align="start" gap="2" style={{ width: '100%' }}>
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Flex
                              align="center"
                              gap="1"
                              wrap="wrap"
                              style={{ rowGap: 2, columnGap: 6 }}
                            >
                              <Text
                                size="2"
                                weight="medium"
                                as="span"
                                style={{
                                  color: 'var(--gray-12)',
                                  textDecoration: checkedImpls.includes(i) ? 'line-through' : 'none',
                                  opacity: checkedImpls.includes(i) ? 0.5 : 1,
                                  transition: 'all 0.15s',
                                }}
                              >
                                {impl.title}
                              </Text>
                              {impl.context && (
                                <Tooltip
                                  content={impl.context}
                                  side="top"
                                  align="start"
                                  sideOffset={6}
                                  delayDuration={280}
                                  maxWidth="min(280px, calc(100vw - 2rem))"
                                >
                                  <IconButton
                                    size="1"
                                    variant="ghost"
                                    color="gray"
                                    radius="full"
                                    aria-label="Insight sobre esta implementação"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      flexShrink: 0,
                                      color: 'var(--gray-10)',
                                      cursor: 'default',
                                    }}
                                  >
                                    <Sparkles size={14} strokeWidth={1.5} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Flex>
                          </Box>
                          <TaskBadge type={impl.type} />
                        </Flex>
                        <Text size="2" color="gray" style={{ lineHeight: 1.5 }}>
                          {impl.description}
                        </Text>
                      </Flex>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </Box>
          )}
        </Card>
      </Accordion.Content>
    </Accordion.Item>
  )
}

// ─── Phase ──────────────────────────────────────────────────────
function PhaseBlock({ phase, planId, phaseIndex }: { phase: PlanPhase; planId: string; phaseIndex: number }) {
  return (
    <Accordion.Item value={`phase${phaseIndex}`} style={{ marginBottom: 8 }}>
      <Accordion.Trigger asChild>
        <Flex
          align="center"
          justify="between"
          p="3"
          style={{
            borderRadius: 'var(--radius-3)',
            background: 'var(--accent-9)',
            cursor: 'pointer',
            marginBottom: 4,
          }}
        >
          <Text size="2" weight="bold" style={{ color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            {phase.title}
          </Text>
          <ChevronDownIcon style={{ color: 'rgba(255,255,255,0.7)' }} />
        </Flex>
      </Accordion.Trigger>

      <Accordion.Content className="animate-fade-up">
        <Accordion.Root type="multiple">
          {phase.weeks.map((week, wi) => (
            <WeekBlock key={week.id} week={week} planId={planId} phaseIndex={phaseIndex} weekIndex={wi} />
          ))}
        </Accordion.Root>
      </Accordion.Content>
    </Accordion.Item>
  )
}

// ─── Global counter ──────────────────────────────────────────────
function GlobalCounter({ planId, plan }: { planId: string; plan: Plan }) {
  const progress = useProgressStore((s) => s.progresses[planId])

  let totalAulas = 0, totalImpls = 0
  plan.phases.forEach((ph) => ph.weeks.forEach((w) => {
    totalAulas += w.aulas.length
    totalImpls += w.impls.length
  }))

  const doneAulas = Object.values(progress?.checkedAulas ?? {}).flat().length
  const doneImpls = Object.values(progress?.checkedImpls ?? {}).flat().length

  return (
    <Flex gap="3">
      <Text size="1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--gray-9)' }}>
        Aulas: <Text weight="bold" style={{ color: 'var(--dim-situacao)' }}>{doneAulas}/{totalAulas}</Text>
      </Text>
      <Text size="1" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--gray-9)' }}>
        Impl.: <Text weight="bold" style={{ color: 'var(--dim-tecnico)' }}>{doneImpls}/{totalImpls}</Text>
      </Text>
    </Flex>
  )
}

// ─── Main ────────────────────────────────────────────────────────
export function Result() {
  const params = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { score, planId: storePlanId, leadId: storeLeadId, contact, plan: storePlan, reset } = useQuizStore()
  const { initProgress, loadProgress } = useProgressStore()
  const [copied, setCopied] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(storePlan)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [loadedScore, setLoadedScore] = useState<{ score: ScoreResult; partial: boolean } | null>(null)

  const planId = params.planId ?? storePlanId
  const displayScore = score ?? loadedScore?.score ?? null
  const availabilityIsPartial = !score && Boolean(loadedScore?.partial)

  function goHomeAndReset() {
    reset()
    navigate('/', { replace: true })
  }

  // Carrega plano e progresso (Supabase = fonte da verdade para checks em qualquer dispositivo)
  useEffect(() => {
    if (!planId) {
      navigate('/', { replace: true })
      return
    }

    const samePlanInStore = Boolean(storePlan && storePlanId === planId)

    if (samePlanInStore) {
      setPlan(storePlan)
      void loadProgress(planId)
      return
    }

    setLoading(true)
    ;(async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('content, lead_id, profile_id')
        .eq('id', planId)
        .single()

      if (error || !data) {
        setFetchError(true)
        setLoading(false)
        return
      }

      const fetchedPlan = data.content as Plan
      setPlan(fetchedPlan)

      await loadProgress(planId)
      setLoading(false)
    })()
  }, [planId, storePlan, storePlanId, navigate, loadProgress])

  // Init progress local quando o plano acabou de ser gerado no mesmo fluxo (complementa loadProgress)
  useEffect(() => {
    if (planId && score && storePlan && storePlanId === planId) {
      initProgress(planId, contact.email, score.profileId, contact.phone, storeLeadId ?? undefined)
    }
  }, [planId, score, storePlan, storePlanId, contact.email, contact.phone, storeLeadId, initProgress])

  // Score do quiz some do store após reset / novo acesso só pelo link; reconstrói a partir de `leads` no Supabase.
  useEffect(() => {
    if (!planId || !plan) return
    if (score) {
      setLoadedScore(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const { data: planRow } = await supabase.from('plans').select('lead_id').eq('id', planId).maybeSingle()
      if (!planRow?.lead_id || cancelled) return
      const { data: leadRow } = await supabase
        .from('leads')
        .select('answers, score, objetivo, nicho')
        .eq('id', planRow.lead_id)
        .maybeSingle()
      if (!leadRow || cancelled) return
      const built = buildScoreFromLead(leadRow, plan)
      if (built && !cancelled) setLoadedScore(built)
    })()
    return () => {
      cancelled = true
    }
  }, [planId, plan, score])

  if (loading) {
    return (
      <Box style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Flex direction="column" align="center" justify="center" style={{ flex: 1 }} gap="3">
          <Spinner size="3" />
          <Text size="2" color="gray">Carregando seu plano…</Text>
        </Flex>
      </Box>
    )
  }

  if (fetchError) {
    return (
      <Box style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Flex direction="column" align="center" justify="center" style={{ flex: 1 }} gap="3" px="4">
          <Heading size="5" style={{ fontFamily: 'Inter, sans-serif' }}>Plano não encontrado</Heading>
          <Text size="2" color="gray" style={{ textAlign: 'center', maxWidth: 340 }}>
            Este link pode ter expirado ou o plano ainda está sendo gerado. Tente novamente em instantes.
          </Text>
          <Button onClick={goHomeAndReset} style={{ cursor: 'pointer' }}>Voltar ao início</Button>
        </Flex>
      </Box>
    )
  }

  if (!plan || !planId) return null

  const shareUrl = `${window.location.origin}/plan/${planId}`

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setToastOpen(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openExternal(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function confirmExit() {
    setExitDialogOpen(true)
  }

  const HOURS_LABELS = ['menos de 2h', '2–4h', '4–6h', '6h+']
  const dockItems = [
    { icon: Rss, label: 'Feed', onClick: () => openExternal('https://app.agenze.io/feed') },
    { icon: BookOpen, label: 'Trilhas', onClick: () => openExternal('https://app.agenze.io/courses') },
    { icon: Bot, label: 'Agentes', onClick: () => openExternal('https://app.agenze.io/c/agentes-de-ia-para-gestao-de-trafego/') },
    { icon: Workflow, label: 'Automações', onClick: () => openExternal('https://app.agenze.io/c/automacoes-aplicadas-a-gestao-de-trafego/') },
    { icon: LogOut, label: 'Sair', onClick: confirmExit },
  ]

  return (
    <Toast.Provider swipeDirection="right">
      <Box style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />

        <Box style={{ maxWidth: 680, margin: '0 auto', width: '100%', padding: '32px 16px 132px' }}>

          {/* Header */}
          <Box mb="5" className="animate-fade-up">
            <Heading size="7" mb="2" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
              Seu plano personalizado de 12 semanas
            </Heading>
            <Flex align="center" gap="3" wrap="wrap">
              <Badge size="2" style={{ background: 'var(--accent-9)', color: '#fff' }}>
                {plan.profileName}
              </Badge>
              {displayScore && <Text size="2" color="gray">{displayScore.objetivo}</Text>}
            </Flex>
          </Box>

          {/* Share link */}
          <Callout.Root size="1" variant="surface" mb="5" className="animate-fade-up delay-100">
            <Callout.Text style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
              <Text size="1" color="gray" style={{ fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {shareUrl}
              </Text>
              <Button
                size="1"
                variant="soft"
                color={copied ? 'green' : 'gray'}
                style={{ cursor: 'pointer', flexShrink: 0 }}
                onClick={copyLink}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </Button>
            </Callout.Text>
          </Callout.Root>

          {/* KPI Grid */}
          <Grid columns="2" gap="3" mb="5" className="animate-fade-up delay-200">
            <KpiCard label="Meta da jornada" value="R$10.000/mês" />
            <KpiCard label="Aulas selecionadas" value={`${plan.aulaCount}`} sub="de 136 disponíveis" />
            {displayScore && (
              <>
                <KpiCard
                  label="Disponibilidade"
                  value={availabilityIsPartial ? '—' : (HOURS_LABELS[displayScore.horasDisponiveis] ?? '—')}
                  sub="por dia"
                />
                <KpiCard label="Nicho" value={displayScore.nicho} />
              </>
            )}
          </Grid>

          {/* Score bars */}
          {displayScore && (
            <Box mb="5" className="animate-fade-up delay-300">
              <ScoreBars dimensions={displayScore.dimensions} />
            </Box>
          )}

          {/* Diagnostic */}
          {plan.diagnosticText && (
            <Box mb="5" className="animate-fade-up delay-400">
              <Callout.Root color="indigo" variant="soft" size="2">
                <Callout.Text>
                  <Text size="1" weight="bold" style={{ fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>
                    Diagnóstico do plano
                  </Text>
                  {plan.diagnosticText}
                </Callout.Text>
              </Callout.Root>
            </Box>
          )}

          <Separator size="4" mb="5" />

          {/* Plan */}
          <Box mb="6" className="animate-fade-up delay-500">
            <Flex align="center" justify="between" mb="4">
              <Heading size="5" style={{ fontFamily: 'Inter, sans-serif' }}>Plano 12 Semanas</Heading>
              <GlobalCounter planId={planId} plan={plan} />
            </Flex>

            <Accordion.Root type="multiple" defaultValue={['phase0']}>
              {plan.phases.map((phase, pi) => (
                <PhaseBlock key={phase.id} phase={phase} planId={planId} phaseIndex={pi} />
              ))}
            </Accordion.Root>
          </Box>
        </Box>

        <Box
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 'max(16px, env(safe-area-inset-bottom))',
            transform: 'translateX(-50%)',
            zIndex: 30,
          }}
        >
          <Dock items={dockItems} />
        </Box>
      </Box>

      <Toast.Root
        open={toastOpen}
        onOpenChange={setToastOpen}
        duration={2000}
        style={{
          background: 'var(--color-panel-solid)',
          border: '1px solid var(--gray-4)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-3)',
          boxShadow: 'var(--shadow-4)',
        }}
      >
        <Toast.Description>
          <Text size="2">Link copiado para a área de transferência!</Text>
        </Toast.Description>
      </Toast.Root>
      <Toast.Viewport style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }} />

      <AlertDialog.Root open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>Sair do plano</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Deseja realmente voltar para a home?
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Cancelar</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button
                color="indigo"
                onClick={() => {
                  setExitDialogOpen(false)
                  goHomeAndReset()
                }}
              >
                Confirmar
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Toast.Provider>
  )
}
