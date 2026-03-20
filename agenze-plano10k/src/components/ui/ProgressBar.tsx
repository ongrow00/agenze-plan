import { Text, Flex, Box } from '@radix-ui/themes'

interface ProgressBarProps {
  value: number
  color?: string
  label?: string
  showPercent?: boolean
  animated?: boolean
  height?: number
}

export function ProgressBar({
  value,
  color = 'var(--accent-9)',
  label,
  showPercent = true,
  animated = true,
  height = 8,
}: ProgressBarProps) {
  return (
    <Box style={{ width: '100%' }}>
      {(label || showPercent) && (
        <Flex justify="between" align="center" mb="1">
          {label && (
            <Text size="2" weight="medium" color="gray">{label}</Text>
          )}
          {showPercent && (
            <Text size="2" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--gray-12)' }}>
              {value}%
            </Text>
          )}
        </Flex>
      )}
      <Box
        style={{ width: '100%', borderRadius: 9999, overflow: 'hidden', height, background: 'var(--gray-4)' }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <Box
          className={animated ? 'animate-bar-grow' : ''}
          style={{
            height: '100%',
            borderRadius: 9999,
            width: `${value}%`,
            background: color,
            transition: animated ? undefined : 'width 0.3s ease',
          }}
        />
      </Box>
    </Box>
  )
}

interface DualProgressProps {
  aulasDone: number
  aulasTotal: number
  implsDone: number
  implsTotal: number
}

export function DualProgress({ aulasDone, aulasTotal, implsDone, implsTotal }: DualProgressProps) {
  const ap = aulasTotal > 0 ? Math.round((aulasDone / aulasTotal) * 100) : 0
  const ip = implsTotal > 0 ? Math.round((implsDone / implsTotal) * 100) : 0

  return (
    <Flex gap="3" align="center">
      <Box style={{ flex: 1 }}>
        <Flex align="center" gap="1" mb="1">
          <Text size="1" style={{ color: 'var(--dim-situacao)', fontFamily: 'Inter, sans-serif' }}>Aulas</Text>
          <Text size="1" color="gray" style={{ fontFamily: 'Inter, sans-serif' }}>{aulasDone}/{aulasTotal}</Text>
        </Flex>
        <Box style={{ height: 4, borderRadius: 9999, overflow: 'hidden', background: 'var(--gray-4)' }}>
          <Box style={{ height: '100%', borderRadius: 9999, width: `${ap}%`, background: 'var(--dim-situacao)', transition: 'width 0.5s ease' }} />
        </Box>
      </Box>
      <Box style={{ flex: 1 }}>
        <Flex align="center" gap="1" mb="1">
          <Text size="1" style={{ color: 'var(--dim-tecnico)', fontFamily: 'Inter, sans-serif' }}>Impl.</Text>
          <Text size="1" color="gray" style={{ fontFamily: 'Inter, sans-serif' }}>{implsDone}/{implsTotal}</Text>
        </Flex>
        <Box style={{ height: 4, borderRadius: 9999, overflow: 'hidden', background: 'var(--gray-4)' }}>
          <Box style={{ height: '100%', borderRadius: 9999, width: `${ip}%`, background: 'var(--dim-tecnico)', transition: 'width 0.5s ease' }} />
        </Box>
      </Box>
    </Flex>
  )
}
