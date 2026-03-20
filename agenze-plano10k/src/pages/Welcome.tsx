import { useState } from 'react'
import { Button, Text, Heading, Flex, Box, Badge } from '@radix-ui/themes'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { useQuizStore } from '@/store/quizStore'
import { Navbar } from '@/components/layout/Navbar'
import { BGPattern } from '@/components/ui/bg-pattern'
import { GridSnakeTrail } from '@/components/effects/GridSnakeTrail'
import { useTheme } from '@/hooks/useTheme'
import { AccessDialog } from '@/components/ui/AccessDialog'

export function Welcome() {
  const { isDark } = useTheme()
  const setStep = useQuizStore((s) => s.setStep)
  const [accessOpen, setAccessOpen] = useState(false)

  const btnStyle = {
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    height: 60,
    minHeight: 60,
    boxSizing: 'border-box',
  } as const

  return (
    <Box style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <Flex
        style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        direction="column"
        align="center"
        justify="center"
        px="4"
        py="8"
        gap="8"
      >
        <BGPattern
          variant="grid"
          mask="fade-center"
          size={28}
          fill={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.07)'}
        />
        <GridSnakeTrail cellSize={28} isDark={isDark} />
        <Flex
          direction="column"
          align="center"
          gap="4"
          style={{ maxWidth: 560, textAlign: 'center', position: 'relative', zIndex: 1 }}
          className="animate-fade-up"
        >

          {/* Tag */}
          <Badge size="2" variant="soft" radius="full">
            Plano 10K
          </Badge>

          {/* Headline */}
          <Heading
            size="8"
            style={{
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontSize: '29px',
            }}
          >
            Crie agora seu plano de 12 semanas personalizado para faturar seus primeiros{' '}
            <Text style={{ color: 'var(--accent-9)' }}>R$10.000 por mês</Text>.
          </Heading>

          <Text size="4" color="gray" style={{ lineHeight: 1.2, fontSize: '16px' }}>
            Responda algumas perguntas e vamos criar sua trilha personalizada, mostrando exatamente quais
            habilidades desenvolver, quais ações executar e qual caminho seguir nas próximas 12 semanas.
          </Text>

          <Flex
            direction={{ initial: 'column', sm: 'row' }}
            gap="3"
            width="100%"
            style={{ maxWidth: 440 }}
            justify="center"
          >
            <Button size="4" style={{ ...btnStyle, flex: 1 }} onClick={() => setStep('contact')}>
              Cria Novo Plano
              <ArrowRightIcon />
            </Button>
            <Button size="4" variant="outline" style={{ ...btnStyle, flex: 1 }} onClick={() => setAccessOpen(true)}>
              Acessar existente
            </Button>
          </Flex>

          <AccessDialog open={accessOpen} onOpenChange={setAccessOpen} />
        </Flex>
      </Flex>

      {/* Footer */}
      <Box py="3" style={{ borderTop: '1px solid var(--gray-4)', textAlign: 'center' }}>
        <Text size="1" color="gray">
          © {new Date().getFullYear()} Agenze · Todos os direitos reservados
        </Text>
      </Box>
    </Box>
  )
}
