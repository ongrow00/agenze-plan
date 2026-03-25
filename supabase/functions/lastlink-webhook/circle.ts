import type { PlanTier } from './resolveTier.ts'

const API_BASE = 'https://app.circle.so/api/admin/v2'

/** Access groups na Circle. */
const CIRCLE_ACCESS_GROUP_ID_PRO = 93337
const CIRCLE_ACCESS_GROUP_ID_START = 93338
/** Grupo após reembolso/estorno (substitui acesso Pro/Start). */
const CIRCLE_ACCESS_GROUP_ID_REFUND = 108528

/**
 * ID numérico da tag aplicada a todos os membros (Members → Tags no painel Circle).
 * Coloca `0` para desativar até teres o ID certo.
 */
const CIRCLE_MEMBER_TAG_ID = 0

function headers(): HeadersInit {
  const token = Deno.env.get('CIRCLE_API_TOKEN')?.trim()
  if (!token) throw new Error('CIRCLE_API_TOKEN não configurada')

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

function accessGroupId(tier: Exclude<PlanTier, 'unknown'>): number {
  return tier === 'pro' ? CIRCLE_ACCESS_GROUP_ID_PRO : CIRCLE_ACCESS_GROUP_ID_START
}

function otherAccessGroupId(tier: Exclude<PlanTier, 'unknown'>): number {
  return tier === 'pro' ? CIRCLE_ACCESS_GROUP_ID_START : CIRCLE_ACCESS_GROUP_ID_PRO
}

async function readErr(res: Response): Promise<string> {
  try {
    const j = await res.json() as { message?: string; errors?: string; error_details?: unknown }
    return j.message ?? j.errors ?? JSON.stringify(j.error_details ?? j)
  } catch {
    return await res.text()
  }
}

/** Remove o email do access group (ignora 404). */
async function removeFromAccessGroup(email: string, groupId: number): Promise<void> {
  const url =
    `${API_BASE}/access_groups/${groupId}/community_members?email=${encodeURIComponent(email)}`
  const res = await fetch(url, { method: 'DELETE', headers: headers() })
  if (!res.ok && res.status !== 404) {
    const err = await readErr(res)
    throw new Error(`Circle remove access_group ${groupId}: ${res.status} ${err}`)
  }
}

/** Garante a tag global (merge com tags já existentes). */
async function ensureMemberTag(email: string): Promise<void> {
  const tagId = CIRCLE_MEMBER_TAG_ID
  if (tagId <= 0) return

  const hdrs = headers()
  const searchRes = await fetch(
    `${API_BASE}/community_members/search?email=${encodeURIComponent(email)}`,
    { headers: hdrs },
  )
  if (!searchRes.ok) return

  const member = await searchRes.json() as {
    id?: number
    member_tags?: Array<{ id: number }>
  }
  const mid = member.id
  if (mid === undefined || mid === null) return

  const existing = (member.member_tags ?? []).map((t) => t.id)
  if (existing.includes(tagId)) return

  const merged = [...existing, tagId]
  const putRes = await fetch(`${API_BASE}/community_members/${mid}`, {
    method: 'PUT',
    headers: hdrs,
    body: JSON.stringify({ member_tag_ids: merged }),
  })
  if (!putRes.ok) {
    const err = await readErr(putRes)
    throw new Error(`Circle member tags: ${putRes.status} ${err}`)
  }
}

/**
 * Migra permissão: tira do outro tier, convida se precisar, coloca no access group certo e aplica tag.
 */
export async function syncCircleAccess(
  email: string,
  name: string | null,
  tier: Exclude<PlanTier, 'unknown'>,
): Promise<void> {
  const hdrs = headers()
  const targetGroup = accessGroupId(tier)
  const previousGroup = otherAccessGroupId(tier)

  await removeFromAccessGroup(email, previousGroup)

  const displayName = (name?.trim() || email.split('@')[0] || 'Member').slice(0, 200)

  const inviteBody: Record<string, unknown> = {
    email,
    name: displayName,
    skip_invitation: false,
  }
  if (CIRCLE_MEMBER_TAG_ID > 0) {
    inviteBody.member_tag_ids = [CIRCLE_MEMBER_TAG_ID]
  }

  const inviteRes = await fetch(`${API_BASE}/community_members`, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify(inviteBody),
  })

  if (!inviteRes.ok && inviteRes.status !== 422 && inviteRes.status !== 409) {
    const err = await readErr(inviteRes)
    throw new Error(`Circle community_members: ${inviteRes.status} ${err}`)
  }

  const addRes = await fetch(`${API_BASE}/access_groups/${targetGroup}/community_members`, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify({ email }),
  })

  if (!addRes.ok) {
    const err = await readErr(addRes)
    throw new Error(`Circle access_groups: ${addRes.status} ${err}`)
  }

  await ensureMemberTag(email)
}

/**
 * Reembolso/estorno: remove Pro e Start e coloca o membro no grupo de reembolso.
 * Não apaga a conta na comunidade.
 */
export async function revokeCircleAccess(email: string): Promise<void> {
  await removeFromAccessGroup(email, CIRCLE_ACCESS_GROUP_ID_PRO)
  await removeFromAccessGroup(email, CIRCLE_ACCESS_GROUP_ID_START)

  const hdrs = headers()
  const addRes = await fetch(
    `${API_BASE}/access_groups/${CIRCLE_ACCESS_GROUP_ID_REFUND}/community_members`,
    {
      method: 'POST',
      headers: hdrs,
      body: JSON.stringify({ email }),
    },
  )

  if (!addRes.ok) {
    const err = await readErr(addRes)
    throw new Error(`Circle access_groups refund: ${addRes.status} ${err}`)
  }
}
