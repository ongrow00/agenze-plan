export type QuestionType = 'text' | 'email' | 'phone' | 'choice'

export interface Question {
  id: string
  block: number
  blockLabel: string
  text: string
  type: QuestionType
  /** Várias opções marcáveis; exige botão Próxima (diferente de escolha única com avanço automático). */
  multiSelect?: boolean
  options?: string[]
  conditional?: {
    questionId: string
    minOptionIndex: number // show if answer >= this index
  }
}

/** Próxima só em texto / email / telefone ou em escolha múltipla; escolha única avança ao tocar na opção. */
export function questionNeedsNextStep(q: Question): boolean {
  if (q.type === 'text' || q.type === 'email' || q.type === 'phone') return true
  if (q.type === 'choice' && q.multiSelect) return true
  return false
}

export const QUESTIONS: Question[] = [
  // ─── BLOCO 2 — Situação Atual (P4–P9) ───────────────────────
  {
    id: 'q4',
    block: 2,
    blockLabel: 'Situação Atual',
    text: 'Você já trabalha com marketing digital hoje?',
    type: 'choice',
    options: [
      'Sim, é minha principal fonte de renda',
      'Sim, como renda extra',
      'Não, estou começando agora',
      'Vim de outra área, é tudo novo pra mim',
    ],
  },
  {
    id: 'q5',
    block: 2,
    blockLabel: 'Situação Atual',
    text: 'Qual é o seu faturamento mensal com gestão de tráfego?',
    type: 'choice',
    options: [
      'R$0 — ainda não faturei nada',
      'Até R$2.000/mês',
      'R$2.001 a R$5.000/mês',
      'R$5.001 a R$10.000/mês',
      'Acima de R$10.000/mês',
    ],
  },
  {
    id: 'q6',
    block: 2,
    blockLabel: 'Situação Atual',
    text: 'Quantos clientes ativos você tem hoje?',
    type: 'choice',
    options: [
      'Nenhum',
      '1 cliente',
      '2–3 clientes',
      '4–6 clientes',
      '7 ou mais clientes',
    ],
  },
  {
    id: 'q7',
    block: 2,
    blockLabel: 'Situação Atual',
    text: 'Você trabalha solo ou tem equipe?',
    type: 'choice',
    options: [
      'Totalmente solo',
      'Tenho 1 sócio ou parceiro',
      'Tenho 1–2 funcionários',
      'Tenho 3–5 pessoas',
      'Tenho 6 ou mais pessoas',
    ],
  },
  {
    id: 'q8',
    block: 2,
    blockLabel: 'Situação Atual',
    text: 'Há quanto tempo você está no mercado de tráfego?',
    type: 'choice',
    options: [
      'Ainda não comecei',
      'Menos de 3 meses',
      '3 a 6 meses',
      '6 meses a 1 ano',
      'Mais de 1 ano',
    ],
  },
  {
    id: 'q9',
    block: 2,
    blockLabel: 'Situação Atual',
    text: 'Qual é seu principal objetivo para os próximos 3 meses?',
    type: 'choice',
    options: [
      'Fechar meu primeiro cliente',
      'Chegar a R$5.000/mês',
      'Chegar a R$10.000/mês',
      'Estruturar a agência e contratar',
      'Escalar para R$30k+/mês',
    ],
  },

  // ─── BLOCO 3 — Conhecimento Técnico (P10–P17) ────────────────
  {
    id: 'q10',
    block: 3,
    blockLabel: 'Conhecimento Técnico',
    text: 'Como você avalia seu conhecimento em Meta Ads?',
    type: 'choice',
    options: [
      'Nunca mexi',
      'Sei criar campanha básica',
      'Intermediário',
      'Avançado',
    ],
  },
  {
    id: 'q11',
    block: 3,
    blockLabel: 'Conhecimento Técnico',
    text: 'Você sabe configurar e verificar o Pixel do Facebook?',
    type: 'choice',
    options: [
      'Não sei o que é',
      'Sei o que é, mas nunca configurei',
      'Já configurei algumas vezes',
      'Configuro e valido de forma independente',
    ],
  },
  {
    id: 'q12',
    block: 3,
    blockLabel: 'Conhecimento Técnico',
    text: 'Como você avalia seu conhecimento em Google Ads?',
    type: 'choice',
    options: [
      'Nunca mexi',
      'Já ouvi falar mas nunca usei',
      'Sei o básico',
      'Tenho experiência prática',
    ],
  },
  {
    id: 'q13',
    block: 3,
    blockLabel: 'Conhecimento Técnico',
    text: 'Você já trabalhou com tráfego para e-commerce?',
    type: 'choice',
    options: [
      'Nunca trabalhei com e-commerce',
      'Tenho interesse mas nunca trabalhei',
      'Já trabalhei pontualmente',
      'É um nicho que domino',
    ],
  },
  {
    id: 'q14',
    block: 3,
    blockLabel: 'Conhecimento Técnico',
    text: 'Você sabe criar e usar públicos Lookalike?',
    type: 'choice',
    options: [
      'Não sei o que é',
      'Sei o conceito mas nunca criei',
      'Já criei e usei em campanhas',
      'Domino e sei quando usar cada tipo',
    ],
  },
  {
    id: 'q15',
    block: 3,
    blockLabel: 'Conhecimento Técnico',
    text: 'Você entende de rastreamento de conversões (pixel, eventos)?',
    type: 'choice',
    options: [
      'Não sei o que é',
      'Sei o conceito mas não sei configurar',
      'Consigo configurar com tutorial',
      'Configuro de forma independente',
    ],
  },
  {
    id: 'q16',
    block: 3,
    blockLabel: 'Conhecimento Técnico',
    text: 'Você sabe escrever copy para anúncios?',
    type: 'choice',
    options: [
      'Não sei nada sobre copy',
      'Tenho noção básica',
      'Escrevo copies razoáveis',
      'Sou bom em copy para tráfego',
    ],
  },
  {
    id: 'q17',
    block: 3,
    blockLabel: 'Conhecimento Técnico',
    text: 'Você já usa IA no dia a dia da gestão de tráfego?',
    type: 'choice',
    options: [
      'Nunca usei',
      'Experimentei algumas vezes',
      'Uso regularmente para copies e criativos',
      'Tenho workflows de IA na operação',
    ],
  },

  // ─── BLOCO 4 — Habilidades Comerciais (P18–P23) ──────────────
  {
    id: 'q18',
    block: 4,
    blockLabel: 'Habilidades Comerciais',
    text: 'Você já fez prospecção ativa para conseguir clientes?',
    type: 'choice',
    options: [
      'Nunca prospectei',
      'Já tentei mas sem método',
      'Tenho uma rotina de prospecção',
      'Prospecção é meu ponto forte',
    ],
  },
  {
    id: 'q19',
    block: 4,
    blockLabel: 'Habilidades Comerciais',
    text: 'Como você adquire (ou pretende adquirir) clientes?',
    type: 'choice',
    options: [
      'Indicação de amigos e família',
      'Prospecção ativa no Instagram / DM',
      'Social Selling com conteúdo',
      'Tráfego pago para minha própria agência',
      'Ainda não sei',
    ],
  },
  {
    id: 'q20',
    block: 4,
    blockLabel: 'Habilidades Comerciais',
    text: 'Você sabe calcular o ROI breakeven de um cliente?',
    type: 'choice',
    options: [
      'Não sei o que é',
      'Entendo o conceito mas não sei calcular',
      'Já calculei em alguns casos',
      'Sempre faço antes de fechar qualquer cliente',
    ],
  },
  {
    id: 'q21',
    block: 4,
    blockLabel: 'Habilidades Comerciais',
    text: 'Você já fez uma reunião de fechamento com cliente potencial?',
    type: 'choice',
    options: [
      'Nunca fiz',
      'Já fiz mas não fechei',
      'Já fechei 1–2 clientes em reunião',
      'Tenho método e fecho com consistência',
    ],
  },
  {
    id: 'q22',
    block: 4,
    blockLabel: 'Habilidades Comerciais',
    text: 'Você tem contrato de prestação de serviços?',
    type: 'choice',
    options: [
      'Não tenho e nunca precisei',
      'Ainda não tenho, preciso criar',
      'Tenho um modelo básico',
      'Tenho contrato estruturado com todos os termos',
    ],
  },
  {
    id: 'q23',
    block: 4,
    blockLabel: 'Habilidades Comerciais',
    text: 'Qual ticket você cobra (ou pretende cobrar) por cliente?',
    type: 'choice',
    options: [
      'Ainda não sei quanto cobrar',
      'Até R$500/mês',
      'R$500 a R$1.500/mês',
      'R$1.500 a R$3.000/mês',
      'Acima de R$3.000/mês',
    ],
  },

  // ─── BLOCO 5 — Operação (P24–P27, condicional) ───────────────
  {
    id: 'q24',
    block: 5,
    blockLabel: 'Operação e Entrega',
    text: 'Você envia relatórios periódicos para seus clientes?',
    type: 'choice',
    conditional: { questionId: 'q6', minOptionIndex: 1 },
    options: [
      'Não envio / não sei fazer',
      'Envio relatórios básicos esporadicamente',
      'Tenho modelo profissional e envio regularmente',
    ],
  },
  {
    id: 'q25',
    block: 5,
    blockLabel: 'Operação e Entrega',
    text: 'Você tem um processo de onboarding definido para novos clientes?',
    type: 'choice',
    conditional: { questionId: 'q6', minOptionIndex: 1 },
    options: [
      'Não tenho processo definido',
      'Tenho um checklist básico',
      'Tenho processo completo e padronizado',
    ],
  },
  {
    id: 'q26',
    block: 5,
    blockLabel: 'Operação e Entrega',
    text: 'Você usa ferramentas de automação na sua operação?',
    type: 'choice',
    conditional: { questionId: 'q6', minOptionIndex: 1 },
    options: [
      'Não uso nenhuma automação',
      'Uso planilhas e ferramentas básicas',
      'Tenho automações (n8n, Zapier, etc.)',
    ],
  },
  {
    id: 'q27',
    block: 5,
    blockLabel: 'Operação e Entrega',
    text: 'Já gerenciou campanhas com verba acima de R$5.000/mês?',
    type: 'choice',
    conditional: { questionId: 'q6', minOptionIndex: 1 },
    options: [
      'Nunca gerenciei verba',
      'Gerenciei até R$1.000/mês',
      'Entre R$1.000 e R$5.000/mês',
      'Já gerenciei acima de R$5.000/mês',
    ],
  },

  // ─── BLOCO 6 — Contexto Pessoal (P28–P30) ───────────────────
  {
    id: 'q28',
    block: 6,
    blockLabel: 'Contexto Pessoal',
    text: 'Quantas horas por dia você tem disponível para isso?',
    type: 'choice',
    options: [
      'Menos de 2 horas',
      '2 a 4 horas',
      '4 a 6 horas',
      'Mais de 6 horas (dedicação integral)',
    ],
  },
  {
    id: 'q29',
    block: 6,
    blockLabel: 'Contexto Pessoal',
    text: 'Qual nicho você quer atender (ou já atende)?',
    type: 'choice',
    options: [
      'Ainda não sei',
      'Qualquer nicho',
      'Negócios locais (clínicas, academias, restaurantes…)',
      'Infoprodutos e lançamentos',
      'E-commerce',
      'Serviços B2B',
    ],
  },
  {
    id: 'q30',
    block: 6,
    blockLabel: 'Contexto Pessoal',
    text: 'O que mais te trava hoje para crescer?',
    type: 'choice',
    options: [
      'Não sei por onde começar',
      'Falta de conhecimento técnico',
      'Dificuldade em conseguir clientes',
      'Falta de tempo',
      'Medo de errar ou insegurança',
      'Gestão da operação com vários clientes',
    ],
  },
]

// Perguntas visíveis dado o estado de respostas atual
export function getVisibleQuestions(answers: Record<string, number>): Question[] {
  return QUESTIONS.filter((q) => {
    if (!q.conditional) return true
    const answer = answers[q.conditional.questionId]
    return answer !== undefined && answer >= q.conditional.minOptionIndex
  })
}

export const TOTAL_QUESTIONS = QUESTIONS.length
