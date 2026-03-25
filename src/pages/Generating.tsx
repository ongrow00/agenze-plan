import { useEffect, useMemo, useRef, useState } from 'react'
import { Flex, Text, Heading, Box, Button } from '@radix-ui/themes'
import { ReloadIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { useQuizStore } from '@/store/quizStore'
import { LIBRARY_LESSON_COUNT } from '@/data/courses'

const PROGRESS_STEPS = [
  'Analisando seu diagnóstico…',
  'Salvando seu perfil…',
  `Consultando o catálogo de ${LIBRARY_LESSON_COUNT} aulas…`,
  'Gerando seu plano com IA…',
  'Organizando fases e semanas…',
  'Finalizando seu plano…',
]

/** Mensagens de status; ordem embaralhada a cada ciclo para não soar em loop curto. */
const STATUS_MESSAGES = [
  'Analisando suas respostas…',
  'Processando seus dados…',
  'Interpretando seu perfil…',
  'Cruzando informações estratégicas…',
  'Calculando seu plano personalizado…',
  'Mapeando suas oportunidades…',
  'Identificando gargalos…',
  'Avaliando seu nível atual…',
  'Gerando recomendações…',
  'Estruturando sua trilha de ação…',
  'Otimizando seu caminho…',
  'Validando seu diagnóstico…',
  'Organizando suas prioridades…',
  'Projetando seus próximos passos…',
  'Ajustando seu plano ideal…',
  'Refinando suas estratégias…',
  'Simulando cenários de resultado…',
  'Preparando sua execução…',
  'Finalizando seu plano personalizado…',
  'Concluindo análise completa…',
]

const MESSAGE_INTERVAL_MS = 2400
const TEXT_TRANSITION = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Generating() {
  const generatingStep = useQuizStore((s) => s.generatingStep)
  const generatingError = useQuizStore((s) => s.generatingError)
  const retrySubmit = useQuizStore((s) => s.retrySubmit)

  const initialOrder = useMemo(() => shuffle([...STATUS_MESSAGES]), [])
  const queueRef = useRef(initialOrder)
  const idxRef = useRef(1)

  const [currentLabel, setCurrentLabel] = useState(() => initialOrder[0] ?? '')

  useEffect(() => {
    queueRef.current = initialOrder
    idxRef.current = 1

    const tick = () => {
      if (idxRef.current >= queueRef.current.length) {
        queueRef.current = shuffle([...STATUS_MESSAGES])
        idxRef.current = 0
      }
      const next = queueRef.current[idxRef.current]
      idxRef.current += 1
      setCurrentLabel(next)
    }

    const intervalId = window.setInterval(tick, MESSAGE_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [initialOrder])

  if (generatingError) {
    return (
      <Box style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Flex direction="column" align="center" justify="center" style={{ flex: 1 }} gap="4" px="4">
          <Heading size="5" style={{ fontFamily: 'Inter, sans-serif' }}>
            Algo deu errado
          </Heading>
          <Text size="2" color="gray" style={{ textAlign: 'center', maxWidth: 360 }}>
            Não conseguimos gerar seu plano. Verifique sua conexão e tente novamente.
          </Text>
          <Text size="1" color="gray" style={{ textAlign: 'center', maxWidth: 420 }}>
            {generatingError}
          </Text>
          <Button size="3" onClick={retrySubmit} style={{ cursor: 'pointer' }}>
            <ReloadIcon />
            Tentar novamente
          </Button>
        </Flex>
      </Box>
    )
  }

  return (
    <Box style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <Flex
        direction="column"
        align="center"
        justify="center"
        style={{ flex: 1 }}
        gap="6"
        px="4"
      >
        {/* Animated spinner */}
        <Box style={{ position: 'relative', width: 72, height: 72 }}>
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            style={{ animation: 'spin 1.2s linear infinite' }}
          >
            <circle cx="36" cy="36" r="30" fill="none" stroke="var(--gray-4)" strokeWidth="5" />
            <circle
              cx="36" cy="36" r="30" fill="none"
              stroke="var(--accent-9)" strokeWidth="5"
              strokeDasharray="188" strokeDashoffset="140"
              strokeLinecap="round"
            />
          </svg>
        </Box>

        <Text size="1" color="gray" style={{ fontFamily: 'Inter, sans-serif' }}>
          Isso pode levar alguns minutos…
        </Text>

        <Flex direction="column" align="center" gap="2" style={{ textAlign: 'center', maxWidth: 400 }}>
          <Heading size="5" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
            Criando seu plano personalizado
          </Heading>
          <Box
            style={{
              width: '100%',
              minHeight: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentLabel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={TEXT_TRANSITION}
                style={{ width: '100%' }}
              >
                <Text
                  size="3"
                  color="gray"
                  style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.45, textAlign: 'center' }}
                >
                  {currentLabel}
                </Text>
              </motion.div>
            </AnimatePresence>
          </Box>
        </Flex>

        {/* Step dots */}
        <Flex gap="2">
          {PROGRESS_STEPS.map((_, i) => (
            <Box
              key={i}
              style={{
                width: i === generatingStep ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i <= generatingStep ? 'var(--accent-9)' : 'var(--gray-4)',
                transition: 'all 0.4s ease',
              }}
            />
          ))}
        </Flex>
      </Flex>
    </Box>
  )
}
