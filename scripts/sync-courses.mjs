/**
 * Copia o catálogo e libs compartilhadas para a Edge Function (fonte única em src/).
 * Rode após editar courses.ts, inferPilar ou planLimits: npm run sync:courses
 */
import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const destDir = join(root, 'supabase/functions/generate-plan')

const pairs = [
  ['src/data/courses.ts', 'courses.ts'],
  ['src/lib/inferPilar.ts', 'inferPilar.ts'],
  ['src/lib/planLimits.ts', 'planLimits.ts'],
]

for (const [from, to] of pairs) {
  copyFileSync(join(root, from), join(destDir, to))
  console.log(`sync: ${from} → supabase/functions/generate-plan/${to}`)
}
