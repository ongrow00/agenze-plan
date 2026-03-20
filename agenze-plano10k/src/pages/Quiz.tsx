import { useEffect, useState } from 'react'
import { Button, Text, Heading, Flex, Box, IconButton } from '@radix-ui/themes'
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons'
import { useQuizStore } from '@/store/quizStore'
import { getVisibleQuestions, questionNeedsNextStep, type Question } from '@/data/questions'
import { Navbar } from '@/components/layout/Navbar'

interface OptionButtonProps {
  label: string
  selected: boolean
  index: number
  onClick: () => void
}

function OptionButton({ label, selected, index, onClick }: OptionButtonProps) {
  const letter = String.fromCharCode(65 + index)

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 'var(--radius-3)',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s',
        background: selected ? 'var(--accent-9)' : 'var(--gray-2)',
        border: `1.5px solid ${selected ? 'var(--accent-9)' : 'var(--gray-5)'}`,
        color: selected ? '#fff' : 'var(--gray-12)',
        fontFamily: 'Inter, sans-serif',
        fontSize: 'var(--font-size-2)',
        fontWeight: selected ? 500 : 400,
        boxShadow: selected ? '0 4px 16px color-mix(in srgb, var(--accent-9) 30%, transparent)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'var(--accent-7)'
          e.currentTarget.style.background = 'var(--accent-2)'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'var(--gray-5)'
          e.currentTarget.style.background = 'var(--gray-2)'
        }
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: 'var(--radius-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          background: selected ? 'rgba(255,255,255,0.2)' : 'var(--gray-4)',
          color: selected ? '#fff' : 'var(--gray-9)',
        }}
      >
        {letter}
      </span>
      {label}
    </button>
  )
}

interface QuestionCardProps {
  question: Question
  selectedIndex: number | undefined
  onSelect: (index: number) => void
  animClass: string
}

function QuestionCard({ question, selectedIndex, onSelect, animClass }: QuestionCardProps) {
  return (
    <Box className={animClass}>
      <Text
        size="1"
        style={{
          fontFamily: 'Inter, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--accent-9)',
          display: 'block',
          marginBottom: 12,
        }}
      >
        {question.blockLabel}
      </Text>

      <Heading
        size="6"
        mb="5"
        style={{
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          color: 'var(--gray-12)',
        }}
      >
        {question.text}
      </Heading>

      <Flex direction="column" gap="2">
        {question.options?.map((opt, i) => (
          <OptionButton
            key={i}
            label={opt}
            index={i}
            selected={selectedIndex === i}
            onClick={() => onSelect(i)}
          />
        ))}
      </Flex>
    </Box>
  )
}

export function Quiz() {
  const { currentQuestion, answers, setAnswer, nextQuestion, prevQuestion } = useQuizStore()
  const [animClass, setAnimClass] = useState('animate-slide-in')
  const [displaying, setDisplaying] = useState(currentQuestion)
  const [isAnimating, setIsAnimating] = useState(false)

  const visibleQuestions = getVisibleQuestions(answers)
  const total = visibleQuestions.length
  const question = visibleQuestions[displaying]

  useEffect(() => {
    if (currentQuestion === displaying) return
    setIsAnimating(true)
    setAnimClass(currentQuestion > displaying ? 'animate-slide-out' : 'animate-slide-in-left')
    const t = setTimeout(() => {
      setDisplaying(currentQuestion)
      setAnimClass(currentQuestion > displaying ? 'animate-slide-in' : 'animate-slide-in-left')
      setIsAnimating(false)
    }, 180)
    return () => clearTimeout(t)
  }, [currentQuestion, displaying])

  const selectedIndex = question ? answers[question.id] : undefined
  const canAdvance = selectedIndex !== undefined

  function handleSelect(index: number) {
    if (!question) return
    setAnswer(question.id, index)
    if (!questionNeedsNextStep(question)) {
      setTimeout(() => nextQuestion(), 280)
    }
  }

  if (!question) return null

  const showNext = questionNeedsNextStep(question)
  const nextLabel = displaying === total - 1 ? 'Ver meu plano' : 'Próxima'

  const nextBtnStyle = {
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    height: 60,
    minHeight: 60,
    boxSizing: 'border-box' as const,
  }

  return (
    <Box style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar progress={{ current: displaying + 1, total }} />

      <Box className="quiz-scroll">
        <Box style={{ width: '100%', maxWidth: 560, margin: '0 auto' }} pt="4">
          <Flex align="center" mb="4">
            <IconButton
              variant="ghost"
              color="gray"
              size="3"
              radius="full"
              aria-label="Voltar"
              onClick={prevQuestion}
              style={{ cursor: 'pointer' }}
            >
              <ArrowLeftIcon width={22} height={22} />
            </IconButton>
          </Flex>

          <QuestionCard
            question={question}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            animClass={animClass}
          />

          {showNext && (
            <Flex justify="end" mt="5">
              <Button
                disabled={!canAdvance || isAnimating}
                style={{
                  ...nextBtnStyle,
                  cursor: canAdvance ? 'pointer' : 'not-allowed',
                }}
                onClick={nextQuestion}
              >
                {nextLabel}
                <ArrowRightIcon />
              </Button>
            </Flex>
          )}
        </Box>
      </Box>
    </Box>
  )
}
