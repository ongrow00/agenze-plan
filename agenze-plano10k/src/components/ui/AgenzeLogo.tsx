import logoLight from '@/assets/logo.png'
import logoDark from '@/assets/logo-dark.png'
import { useTheme } from '@/hooks/useTheme'

interface AgenzeLogoProps {
  height?: number
  className?: string
}

export function AgenzeLogo({ height = 28, className = '' }: AgenzeLogoProps) {
  const { isDark } = useTheme()

  return (
    <img
      src={isDark ? logoDark : logoLight}
      alt="Agenze"
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
      className={className}
    />
  )
}
