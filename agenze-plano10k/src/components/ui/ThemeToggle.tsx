import { IconButton } from '@radix-ui/themes'
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { toggle, isDark } = useTheme()

  return (
    <IconButton
      variant="soft"
      color="gray"
      size="2"
      style={{ cursor: 'pointer' }}
      onClick={toggle}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  )
}
