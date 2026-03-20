import { Flex, Text, Box } from '@radix-ui/themes'
import { useNavigate } from 'react-router-dom'
import { AgenzeLogo } from '@/components/ui/AgenzeLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useQuizStore } from '@/store/quizStore'

interface NavbarProps {
  progress?: { current: number; total: number }
}

export function Navbar({ progress }: NavbarProps) {
  const navigate = useNavigate()
  const cancelGenerating = useQuizStore((s) => s.cancelGenerating)

  function handleGoHome() {
    cancelGenerating()
    navigate('/')
  }

  return (
    <Box
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--color-background)',
        borderBottom: '1px solid var(--gray-4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <Box style={{ height: 56, maxWidth: 900, margin: '0 auto', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', padding: '0 16px' }}>

        {/* Logo — centralizada absolutamente */}
        <Box style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <button
            onClick={handleGoHome}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            aria-label="Voltar para o início"
          >
            <AgenzeLogo height={28} />
          </button>
        </Box>

        {/* Direita — toggle + contador */}
        <Flex align="center" gap="3" style={{ marginLeft: 'auto' }}>
          {progress && (
            <Text size="1" color="gray">
              {progress.current} / {progress.total}
            </Text>
          )}
          <ThemeToggle />
        </Flex>
      </Box>

      {/* Quiz progress bar */}
      {progress && (
        <Box style={{ height: 2, background: 'var(--gray-4)' }}>
          <Box
            style={{
              height: '100%',
              width: `${(progress.current / progress.total) * 100}%`,
              background: 'var(--accent-9)',
              transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </Box>
      )}
    </Box>
  )
}
