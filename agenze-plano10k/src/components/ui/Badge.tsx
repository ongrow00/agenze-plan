import type { TaskType } from '@/types'

const BADGE_LABELS: Record<TaskType, string> = {
  criar: 'criar',
  fazer: 'fazer',
  rotina: 'rotina',
  testar: 'testar',
  marco: 'marco',
}

interface BadgeProps {
  type: TaskType
  className?: string
}

export function TaskBadge({ type, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wide ${className}`}
      style={{
        background: `var(--badge-${type}-bg)`,
        color: `var(--badge-${type}-fg)`,
      }}
    >
      {BADGE_LABELS[type]}
    </span>
  )
}
