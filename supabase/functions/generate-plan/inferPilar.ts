/** Pilar pedagógico inferido pelo nome da trilha (para prompts e filtros). */
export type Pilar = 'comercial' | 'tecnico' | 'copy' | 'operacao' | 'outro'

export function inferPilar(trilha: string): Pilar {
  const t = trilha.toLowerCase()

  if (
    t.includes('aquisição') ||
    t.includes('aquisicao') ||
    t.includes('monetização') ||
    t.includes('monetizacao')
  ) {
    return 'comercial'
  }
  if (t.includes('máquina de reuniões') || t.includes('maquina de reunioes') || t.includes('replay')) {
    return 'comercial'
  }
  if (t.includes('escala de agência') || t.includes('escala de agencia')) return 'comercial'

  if (t.includes('sucesso do cliente')) return 'operacao'

  if (t.includes('copy')) return 'copy'
  if (t.includes('agentes de ia') || t.includes('engenharia de prompt') || t.includes('head de ia')) {
    return 'copy'
  }

  if (t.includes('template e materiais')) return 'outro'
  if (t.includes('conceitos e pilares')) return 'outro'
  if (t.includes('vivendo de tráfego') || t.includes('vivendo de trafego')) return 'outro'

  if (
    t.includes('meta ads') ||
    t.includes('google ads') ||
    t.includes('pinterest') ||
    t.includes('e-commerce') ||
    t.includes('ecommerce') ||
    t.includes('andromeda')
  ) {
    return 'tecnico'
  }
  if (t.includes('biblioteca') || t.includes('automação') || t.includes('automacao')) return 'tecnico'
  if (t.includes('automatizada')) return 'tecnico'
  if (t.includes('tráfego para') || t.includes('trafego para')) return 'tecnico'

  return 'outro'
}
