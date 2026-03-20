import { COURSES } from './courses.ts'
import { inferPilar } from './inferPilar.ts'
import { getWeeklyLimits } from './planLimits.ts'

export interface ScorePayload {
  dimensions: { situacao: number; tecnico: number; comercial: number; copy: number; operacao: number | null }
  profileId: string
  profileName: string
  faturamento: number
  clientes: number
  tempoMercado: number
  horasDisponiveis: number
  objetivo: string
  nicho: string
  mainBlock: string
}

export function buildCourseCatalogText(): string {
  return COURSES.map((c, i) => {
    const p = inferPilar(c.trilha)
    return `[${i + 1}] Pilar: ${p} | ${c.titulo} | Trilha: ${c.trilha} | ${c.sinopse} | Link: ${c.link}`
  }).join('\n')
}

function commercialGapDirective(score: ScorePayload): string {
  const { tecnico, comercial } = score.dimensions
  if (tecnico - comercial >= 22) {
    return `
### DIRETRIZ DE DESEQUILÍBRIO (técnico >> comercial)
O aluno está mais forte em técnico do que em comercial. Nas **primeiras 6 semanas**, priorize aulas com **Pilar: comercial** e ações de prospecção, oferta e conversa — sem negligenciar o mínimo necessário de técnico para executar.
Sempre mantenha **ações comerciais recorrentes** (mesmo que pequenas) em paralelo ao estudo técnico.`
  }
  if (comercial - tecnico >= 22) {
    return `
### DIRETRIZ DE DESEQUILÍBRIO (comercial >> técnico)
O aluno está mais forte em comercial. Garanta **fundação técnica** onde ainda houver lacunas (Meta, estrutura, métricas), mas **não** empurre semanas só de teoria: comercial continua presente.`
  }
  return ''
}

export function buildPrompt(score: ScorePayload, name: string, answersSummary: string): string {
  const faturamentoLabels = ['R$0 (nunca vendi)', 'R$1-2k/mês', 'R$2-5k/mês', 'R$5-10k/mês', 'R$10-20k/mês', 'R$20k+/mês']
  const clientesLabels = ['0 clientes', '1-2 clientes', '3-5 clientes', '6-10 clientes', '10+ clientes']
  const tempoLabels = ['menos de 6 meses', '6-12 meses', '1-2 anos', '2-4 anos', '4+ anos']
  const horasLabels = ['menos de 2h/dia', '2-4h/dia', '4-6h/dia', '6h+ por dia']

  const wl = getWeeklyLimits(score.horasDisponiveis)

  const answersBlock =
    answersSummary.trim().length > 0
      ? `## RESPOSTAS DO QUIZ (detalhado)

${answersSummary}`
      : ''

  return `Você é um especialista em gestão de tráfego pago e criador de trilhas de aprendizado personalizadas.

## POLÍTICA OBRIGATÓRIA

1. **Meta final:** plano de 12 semanas para ${name} chegar a **R$10.000/mês** com gestão de tráfego.
2. **Eixo de negócio:** o **comercial** (aquisição, conversa, oferta, follow-up, prospecção) é o **core** — deve aparecer de forma **consistente** ao longo do plano.
3. **Conteúdo não comercial** (técnico, copy, operação, automação): inclua quando o perfil ou as respostas mostrarem **lacuna** que impeça vender ou entregar; é **fundação para executar e cobrar**, não fim em si.
4. **Semanas com mais “fundação técnica”** ainda devem ter **ações comerciais mínimas** (prospecção, mensagem, follow-up ou revisão de oferta).
5. Respeite **rigorosamente** os limites de carga semanal abaixo (derivados da disponibilidade informada).

${answersBlock}

## PERFIL DO ALUNO

- Nome: ${name}
- Perfil: ${score.profileId} — ${score.profileName}
- Faturamento atual: ${faturamentoLabels[score.faturamento] ?? 'Não informado'}
- Clientes ativos: ${clientesLabels[score.clientes] ?? 'Não informado'}
- Tempo no mercado: ${tempoLabels[score.tempoMercado] ?? 'Não informado'}
- Horas disponíveis por dia: ${horasLabels[score.horasDisponiveis] ?? 'Não informado'}
- Nicho de interesse: ${score.nicho}
- Objetivo: ${score.objetivo}
- Principal gargalo identificado: ${score.mainBlock}

## SCORE POR DIMENSÃO (0-100)

- Situação atual: ${score.dimensions.situacao}
- Técnico (tráfego pago): ${score.dimensions.tecnico}
- Comercial (vendas/prospecção): ${score.dimensions.comercial}
- Copy (criação de copy/criativos): ${score.dimensions.copy}
- Operação (gestão de clientes): ${score.dimensions.operacao ?? 'N/A — sem clientes ainda'}

${commercialGapDirective(score)}

## LIMITES DE CARGA (obrigatório)

Com base na disponibilidade **${horasLabels[score.horasDisponiveis] ?? 'informada'}**:

- **Por semana:** entre **${wl.aulasMin} e ${wl.aulasMax} aulas** no catálogo e entre **${wl.implsMin} e ${wl.implsMax} itens** no checklist de implementação (\`impls\`).
- **Total do plano:** entre **40 e 65 aulas** no conjunto das 12 semanas.
- Ajuste o número de \`impls\` à **necessidade da semana** (pode ser mais itens em semanas comerciais densas, sem ultrapassar ${wl.implsMax} salvo se for indispensável e coerente com as horas).

## CATÁLOGO DE AULAS (${COURSES.length} aulas)

Cada linha indica **Pilar** inferido da trilha (comercial, técnico, copy, operação, outro). Use para balancear o plano.

${buildCourseCatalogText()}

## INSTRUÇÕES

1. Selecione entre **40 e 65** aulas do catálogo que fazem sentido para esse perfil específico.
2. Distribua as aulas em **12 semanas**, em **3 a 5 fases** temáticas.
3. Em **cada semana**, inclua **implementações práticas** (\`impls\`: ações concretas, não só estudo). Quantidade variável conforme a necessidade, **dentro** dos limites de carga.
4. O ritmo deve respeitar a disponibilidade de horas por dia e os limites de aulas/semana e impls/semana.
5. Use os links **EXATOS** do catálogo — não invente links nem títulos inexistentes.

## FORMATO DE RESPOSTA

Responda APENAS com JSON válido, sem markdown, sem explicações. Estrutura exata:

{
  "profileId": "${score.profileId}",
  "profileName": "${score.profileName}",
  "diagnosticText": "texto de 2-3 frases explicando o diagnóstico personalizado",
  "aulaCount": <número total de aulas selecionadas>,
  "phases": [
    {
      "id": "phase0",
      "title": "FASE 1 — <nome>",
      "weeks": [
        {
          "id": "w1",
          "title": "Semana 1 · <título>",
          "goal": "objetivo da semana em 1 frase",
          "revenue": "~R$2.000",
          "aulas": [
            { "title": "<título exato do catálogo>", "duration": "45 min", "link": "<link exato>" }
          ],
          "impls": [
            { "title": "<título>", "type": "<criar|fazer|rotina|testar|marco>", "description": "<descrição>", "context": "<dica opcional>" }
          ]
        }
      ]
    }
  ]
}`
}
