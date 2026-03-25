import type { LastlinkData } from './mapPayload.ts'

export type PlanTier = 'pro' | 'start' | 'unknown'

function hasWord(name: string, word: string): boolean {
  const re = new RegExp(`\\b${word}\\b`, 'i')
  return re.test(name)
}

/** Upgrade (ex.: "Upgrade Start") — sobe para Pro e migra access no Circle. */
function hasUpgradeInName(name: string): boolean {
  return /\bupgrade\b/i.test(name)
}

/**
 * Plano só pelo nome em `Data.Products[].Name`:
 * 1. contém "upgrade" (ex.: "Upgrade Start") → Pro
 * 2. contém "Pro" como palavra → Pro
 * 3. contém "Start" como palavra (ex.: "Agência Start") → Start
 * 4. default → Start
 * Sem produtos → unknown
 */
export function resolvePlanTier(data: LastlinkData | undefined): PlanTier {
  const products = data?.Products
  if (!products?.length) return 'unknown'

  for (const p of products) {
    const name = (p.Name ?? '').trim()
    if (!name) continue
    if (hasUpgradeInName(name)) return 'pro'
  }

  for (const p of products) {
    const name = (p.Name ?? '').trim()
    if (!name) continue
    if (hasWord(name, 'pro')) return 'pro'
  }

  for (const p of products) {
    const name = (p.Name ?? '').trim()
    if (!name) continue
    if (hasWord(name, 'start')) return 'start'
  }

  return 'start'
}
