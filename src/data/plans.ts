import type { Plan } from '@/types'

export const PLANS: Record<string, Plan> = {
  P0: {
    profileId: 'P0',
    profileName: 'Iniciante Absoluto',
    aulaCount: 48,
    diagnosticText:
      'Você está começando do zero — e isso é uma vantagem. O plano prioriza o lado comercial desde a primeira semana. Não espere dominar a técnica para prospectar: o primeiro cliente fecha enquanto você ainda está aprendendo.',
    phases: [
      {
        id: 'fase1',
        title: 'Fase 1 — Fundação',
        weeks: [
          {
            id: 'w1',
            title: 'Semana 1 — Mentalidade + Primeiros Passos',
            goal: 'Entender o mercado e dar os primeiros passos concretos',
            revenue: 'R$0 → primeiro contato comercial',
            aulas: [
              { title: 'Vivendo de Tráfego — Introdução', duration: '45 min' },
              { title: 'O que é Gestão de Tráfego', duration: '30 min' },
              { title: 'Como o Mercado Funciona', duration: '40 min' },
              { title: 'Criando sua Conta Business Manager', duration: '25 min' },
              { title: 'Conceitos Essenciais de Anúncios', duration: '35 min' },
            ],
            impls: [
              {
                title: 'Criar conta Business Manager',
                type: 'criar',
                description: 'Crie sua conta no Meta Business Suite e configure o perfil profissional.',
                context: 'Esse é o seu "escritório" no Meta. Tudo acontece aqui.',
              },
              {
                title: 'Listar 20 prospects locais',
                type: 'criar',
                description: 'Faça uma planilha com 20 empresas locais do seu bairro/cidade com Instagram ativo mas sem presença de anúncios.',
                context: 'Negócios locais são o ponto de entrada mais rápido para iniciantes.',
              },
              {
                title: 'Enviar 5 DMs de abordagem',
                type: 'fazer',
                description: 'Use o modelo de abordagem da Agenze e envie para 5 prospects da sua lista.',
              },
              {
                title: 'Prospecção diária: 3 DMs',
                type: 'rotina',
                description: 'Todo dia, envie 3 mensagens de prospecção — antes de qualquer outra atividade.',
              },
            ],
          },
          {
            id: 'w2',
            title: 'Semana 2 — Criando Campanhas do Zero',
            goal: 'Criar a primeira campanha real e continuar prospecção',
            revenue: 'R$0 → 1ª reunião agendada',
            aulas: [
              { title: 'Meta ADS — Estrutura de Campanha', duration: '50 min' },
              { title: 'Públicos: Interesse vs. Comportamento', duration: '40 min' },
              { title: 'Criando o Primeiro Conjunto de Anúncios', duration: '45 min' },
              { title: 'Copy Persuasiva — Fundamentos', duration: '35 min' },
              { title: 'Criativo que Converte', duration: '30 min' },
            ],
            impls: [
              {
                title: 'Criar campanha de teste (verba mínima)',
                type: 'criar',
                description: 'Crie uma campanha de tráfego no seu próprio perfil ou em uma conta de teste com R$5/dia por 3 dias.',
                context: 'Errar aqui é aprendizado. O objetivo é a prática, não o resultado.',
              },
              {
                title: 'Escrever 3 copies de anúncio',
                type: 'criar',
                description: 'Escreva 3 versões de copy para um negócio local hipotético. Use a estrutura: Dor → Solução → CTA.',
              },
              {
                title: 'Agendar primeira reunião',
                type: 'marco',
                description: 'Converta ao menos 1 prospect em reunião agendada para essa semana ou a próxima.',
              },
              {
                title: 'Prospecção diária: 3 DMs',
                type: 'rotina',
                description: 'Manter cadência diária de prospecção — não pode parar.',
              },
            ],
          },
        ],
      },
      {
        id: 'fase2',
        title: 'Fase 2 — Primeiro Cliente',
        weeks: [
          {
            id: 'w3',
            title: 'Semana 3 — Fechamento + Setup do Cliente',
            goal: 'Fechar o primeiro cliente e iniciar o onboarding',
            revenue: 'R$500–R$1.500 (primeiro contrato)',
            aulas: [
              { title: 'Como Precificar seus Serviços', duration: '40 min' },
              { title: 'Reunião de Fechamento — Roteiro', duration: '35 min' },
              { title: 'Contrato e Proposta Comercial', duration: '30 min' },
              { title: 'Pixel — Instalação e Verificação', duration: '45 min' },
              { title: 'Onboarding do Cliente — Checklist', duration: '25 min' },
            ],
            impls: [
              {
                title: 'Fazer reunião de fechamento',
                type: 'fazer',
                description: 'Realize a reunião com o prospect mais quente. Use o roteiro de fechamento da Agenze.',
              },
              {
                title: 'Enviar proposta e contrato',
                type: 'criar',
                description: 'Envie a proposta personalizada e o contrato em até 24h após a reunião.',
                context: 'Velocidade no follow-up aumenta taxa de fechamento em 3x.',
              },
              {
                title: 'Instalar Pixel no cliente',
                type: 'fazer',
                description: 'Configure o Pixel do Meta no site do cliente e valide os eventos com o Pixel Helper.',
              },
              {
                title: 'Documentar processo de onboarding',
                type: 'criar',
                description: 'Crie um checklist de onboarding para reutilizar com todos os próximos clientes.',
              },
            ],
          },
          {
            id: 'w4',
            title: 'Semana 4 — Primeira Campanha para Cliente',
            goal: 'Subir a primeira campanha real e gerar resultados iniciais',
            revenue: 'R$500–R$1.500 (cliente ativo)',
            aulas: [
              { title: 'Estrutura de Campanha Profissional', duration: '45 min' },
              { title: 'Teste A/B de Criativos', duration: '35 min' },
              { title: 'Leitura de Métricas — O que Analisar', duration: '40 min' },
              { title: 'Relatório Básico para Clientes', duration: '30 min' },
            ],
            impls: [
              {
                title: 'Subir campanha real para o cliente',
                type: 'fazer',
                description: 'Lance a primeira campanha com pelo menos 2 conjuntos e 3 criativos diferentes.',
              },
              {
                title: 'Criar modelo de relatório',
                type: 'criar',
                description: 'Desenvolva seu template de relatório semanal para enviar aos clientes.',
              },
              {
                title: 'Enviar primeiro relatório',
                type: 'marco',
                description: 'Envie o relatório da semana 1 de campanha, mesmo que os resultados sejam preliminares.',
                context: 'Relatório semanal é o que separa gestores profissionais dos amadores.',
              },
              {
                title: 'Prospecção: 3 DMs/dia',
                type: 'rotina',
                description: 'Não pause a prospecção — o segundo cliente deve ser captado enquanto o primeiro está ativo.',
              },
            ],
          },
        ],
      },
      {
        id: 'fase3',
        title: 'Fase 3 — Otimização',
        weeks: [
          {
            id: 'w5',
            title: 'Semana 5 — Otimização e Copy Avançada',
            goal: 'Melhorar resultados e dominar copy persuasiva',
            revenue: 'R$1.500 (1 cliente consolidado)',
            aulas: [
              { title: 'Otimização de Campanha — Quando e Como', duration: '50 min' },
              { title: 'Copy Avançada — Gatilhos Mentais', duration: '40 min' },
              { title: 'Públicos Avançados — Lookalike', duration: '35 min' },
              { title: 'Retargeting Estratégico', duration: '40 min' },
            ],
            impls: [
              {
                title: 'Analisar e otimizar campanhas do cliente',
                type: 'testar',
                description: 'Identifique o criativo/anúncio com menor CPR e escale o budget em 20%. Pause os de maior CPA.',
              },
              {
                title: 'Criar público Lookalike',
                type: 'criar',
                description: 'Crie 3 públicos Lookalike (1%, 2%, 3%) baseados na lista de clientes do seu cliente.',
              },
              {
                title: 'Escrever 5 copies usando gatilhos mentais',
                type: 'criar',
                description: 'Produza 5 variações de copy usando os gatilhos: escassez, prova social, autoridade.',
              },
            ],
          },
          {
            id: 'w6',
            title: 'Semana 6 — Segundo Cliente',
            goal: 'Fechar o segundo cliente e estruturar a operação',
            revenue: 'R$2.000–R$3.000 (2 clientes)',
            aulas: [
              { title: 'Gerenciando Múltiplos Clientes', duration: '35 min' },
              { title: 'Social Selling — Construindo Autoridade', duration: '40 min' },
              { title: 'Google Ads — Introdução', duration: '45 min' },
            ],
            impls: [
              {
                title: 'Fechar o segundo cliente',
                type: 'marco',
                description: 'Realize ao menos 2 reuniões de fechamento essa semana. Meta: 1 contrato assinado.',
              },
              {
                title: 'Criar post de prova social',
                type: 'criar',
                description: 'Publique um post no Instagram mostrando resultado do primeiro cliente (com permissão).',
              },
              {
                title: 'Montar rotina de gestão de 2 clientes',
                type: 'rotina',
                description: 'Defina horários fixos para cada cliente: análise de métricas, otimização, relatório.',
              },
            ],
          },
        ],
      },
      {
        id: 'fase4',
        title: 'Fase 4 — Crescimento',
        weeks: [
          {
            id: 'w7',
            title: 'Semana 7 — IA na Gestão de Tráfego',
            goal: 'Incorporar IA na rotina e ganhar velocidade',
            revenue: 'R$3.000–R$5.000',
            aulas: [
              { title: 'IA para Gestores de Tráfego', duration: '50 min' },
              { title: 'Prompts de Copy com IA', duration: '35 min' },
              { title: 'Automações Básicas com IA', duration: '40 min' },
            ],
            impls: [
              {
                title: 'Criar biblioteca de prompts de copy',
                type: 'criar',
                description: 'Monte um documento com 10 prompts validados para gerar copies de anúncio com IA.',
              },
              {
                title: 'Testar workflow de relatório com IA',
                type: 'testar',
                description: 'Use IA para gerar o rascunho do relatório semanal a partir das métricas do cliente.',
                context: 'Relatórios com IA levam 10 min, não 1 hora.',
              },
            ],
          },
          {
            id: 'w8',
            title: 'Semana 8 — Escalando a Carteira',
            goal: 'Chegar a 3 clientes e R$5k+',
            revenue: 'R$4.500–R$6.000 (3 clientes)',
            aulas: [
              { title: 'Escala de Carteira sem Perder Qualidade', duration: '40 min' },
              { title: 'Retenção de Clientes', duration: '35 min' },
              { title: 'Advantage+ Shopping e CBO', duration: '45 min' },
            ],
            impls: [
              {
                title: 'Fechar 3º cliente',
                type: 'marco',
                description: 'Com 2 clientes ativos e resultados, a prova social facilita o fechamento do terceiro.',
              },
              {
                title: 'Revisar precificação',
                type: 'fazer',
                description: 'Com 3 clientes, é hora de aumentar o ticket. Revise sua tabela de preços para novos contratos.',
              },
            ],
          },
        ],
      },
      {
        id: 'fase5',
        title: 'Fase 5 — Consolidação',
        weeks: [
          {
            id: 'w9',
            title: 'Semana 9 — Processos e Automações',
            goal: 'Automatizar a operação para escalar sem dobrar horas',
            revenue: 'R$6.000–R$8.000',
            aulas: [
              { title: 'Automações para Gestores — n8n/Zapier', duration: '50 min' },
              { title: 'Criando SOPs da Agência', duration: '35 min' },
              { title: 'Dashboard de Resultados para Clientes', duration: '40 min' },
            ],
            impls: [
              {
                title: 'Documentar SOP de onboarding',
                type: 'criar',
                description: 'Crie um documento passo-a-passo de como integrar um novo cliente — 100% replicável.',
              },
              {
                title: 'Configurar 1 automação de relatório',
                type: 'fazer',
                description: 'Automatize o envio semanal de métricas para clientes usando n8n ou Zapier.',
              },
            ],
          },
          {
            id: 'w10',
            title: 'Semana 10 — Estratégia de Escala',
            goal: 'Estruturar para R$10k e além',
            revenue: 'R$8.000–R$10.000',
            aulas: [
              { title: 'Estratégia de Escala de Agência', duration: '45 min' },
              { title: 'Como Contratar e Treinar', duration: '35 min' },
              { title: 'Posicionamento e Nicho', duration: '40 min' },
            ],
            impls: [
              {
                title: 'Definir nicho primário',
                type: 'marco',
                description: 'Escolha 1 nicho para ser referência. Generalistas crescem devagar, especialistas escalam rápido.',
                context: 'Com 3+ clientes, você tem dados suficientes para identificar onde gera mais resultado.',
              },
              {
                title: 'Estruturar proposta de valor para o nicho',
                type: 'criar',
                description: 'Reescreva sua proposta comercial focada no nicho escolhido com casos de sucesso.',
              },
            ],
          },
          {
            id: 'w11',
            title: 'Semana 11 — Auditoria e Ajustes',
            goal: 'Revisar todos os clientes e otimizar resultados',
            revenue: 'R$8.000–R$10.000',
            aulas: [
              { title: 'Auditoria de Contas — Metodologia', duration: '40 min' },
              { title: 'Métricas Avançadas de Performance', duration: '35 min' },
            ],
            impls: [
              {
                title: 'Auditar todas as contas',
                type: 'fazer',
                description: 'Faça uma revisão completa de cada conta — estrutura, criativos, públicos, métricas.',
              },
              {
                title: 'Reunião de resultado com cada cliente',
                type: 'rotina',
                description: 'Apresente um relatório mensal de resultados para cada cliente. Valorize o que está entregando.',
              },
            ],
          },
          {
            id: 'w12',
            title: 'Semana 12 — R$10k e Próximos Passos',
            goal: 'Celebrar, consolidar e planejar a próxima fase',
            revenue: 'R$10.000/mês',
            aulas: [
              { title: 'Agência de Tráfego — Próximo Nível', duration: '45 min' },
              { title: 'Escalando para R$30k', duration: '40 min' },
            ],
            impls: [
              {
                title: 'Checkpoint: R$10k atingido?',
                type: 'marco',
                description: 'Some o faturamento dos últimos 30 dias. Se chegou a R$10k: planeje a expansão. Se não: identifique o gargalo e ajuste.',
              },
              {
                title: 'Planejar contratação do 1º assistente',
                type: 'fazer',
                description: 'Escreva a descrição da vaga e o processo de treinamento para seu primeiro assistente de tráfego.',
              },
              {
                title: 'Definir meta para os próximos 90 dias',
                type: 'marco',
                description: 'Com o diagnóstico atualizado, defina o objetivo da próxima fase: R$20k, R$30k, ou especialização.',
              },
            ],
          },
        ],
      },
    ],
  },

  P1: {
    profileId: 'P1',
    profileName: 'Iniciante com Base Técnica',
    aulaCount: 38,
    diagnosticText:
      'Você tem base técnica acima da média para um iniciante — o que significa que seu gargalo real é o comercial. O plano cortou as aulas técnicas que você já domina e dobrou o foco em prospecção, fechamento e precificação.',
    phases: [
      {
        id: 'fase1',
        title: 'Fase 1 — Comercial em Primeiro',
        weeks: [
          {
            id: 'w1',
            title: 'Semana 1 — Prospecção Intensiva',
            goal: 'Iniciar prospecção ativa imediatamente',
            revenue: 'R$0 → 1ª reunião',
            aulas: [
              { title: 'Aquisição de Clientes — Módulo Completo', duration: '60 min' },
              { title: 'Social Selling para Gestores', duration: '45 min' },
              { title: 'Copy Persuasiva — Fundamentos', duration: '35 min' },
            ],
            impls: [
              {
                title: 'Listar 30 prospects e iniciar abordagem',
                type: 'criar',
                description: 'Com base técnica, você pode abordar clientes mais sofisticados. Monte lista de 30 prospects.',
              },
              {
                title: 'Prospecção: 5 DMs/dia',
                type: 'rotina',
                description: 'Volume maior — você já tem o conhecimento para passar confiança.',
              },
              {
                title: 'Definir precificação',
                type: 'fazer',
                description: 'Com conhecimento técnico, justifique um ticket acima da média. Calcule seu mínimo viável.',
              },
            ],
          },
          {
            id: 'w2',
            title: 'Semana 2 — Fechamento e Contrato',
            goal: 'Fechar o primeiro cliente já nesta semana',
            revenue: 'R$800–R$2.000 (primeiro contrato)',
            aulas: [
              { title: 'Reunião de Fechamento — Roteiro', duration: '35 min' },
              { title: 'Proposta e Contrato Profissional', duration: '30 min' },
              { title: 'Como Precificar Acima da Média', duration: '25 min' },
            ],
            impls: [
              {
                title: 'Fazer 3+ reuniões de fechamento',
                type: 'fazer',
                description: 'Com base técnica, mostre confiança. Meta: 1 cliente fechado até domingo.',
              },
              {
                title: 'Fechar primeiro cliente',
                type: 'marco',
                description: 'Objetivo da semana — não avance sem isso.',
              },
            ],
          },
        ],
      },
      {
        id: 'fase2',
        title: 'Fase 2 — Resultados e Crescimento',
        weeks: [
          {
            id: 'w3',
            title: 'Semana 3 — Execução e Otimização',
            goal: 'Entregar resultado para o primeiro cliente',
            revenue: 'R$800–R$2.000',
            aulas: [
              { title: 'Estrutura de Campanha Profissional', duration: '45 min' },
              { title: 'Métricas que Importam', duration: '35 min' },
              { title: 'Relatório Profissional', duration: '30 min' },
            ],
            impls: [
              { title: 'Subir campanha completa para o cliente', type: 'fazer', description: 'Lance com estrutura completa: fases de aprendizado, CBO, 3 criativos.' },
              { title: 'Enviar primeiro relatório em 7 dias', type: 'marco', description: 'Demonstre profissionalismo imediatamente.' },
            ],
          },
          {
            id: 'w4',
            title: 'Semana 4 — Segundo Cliente',
            goal: 'Fechar segundo cliente enquanto gerencia o primeiro',
            revenue: 'R$2.000–R$4.000',
            aulas: [
              { title: 'Gestão de Múltiplos Clientes', duration: '35 min' },
              { title: 'IA para Gestores de Tráfego', duration: '50 min' },
            ],
            impls: [
              { title: 'Fechar 2º cliente', type: 'marco', description: 'Com um caso de sucesso inicial, o segundo fecha mais rápido.' },
              { title: 'Criar rotina de gestão paralela', type: 'rotina', description: 'Bloquear horários no calendário para cada cliente.' },
            ],
          },
        ],
      },
      {
        id: 'fase3',
        title: 'Fase 3 — Escala',
        weeks: [
          {
            id: 'w5',
            title: 'Semana 5 — IA e Automações',
            goal: 'Ganhar eficiência operacional',
            revenue: 'R$4.000–R$6.000',
            aulas: [
              { title: 'Automações para Gestores', duration: '50 min' },
              { title: 'Advantage+ e CBO Avançado', duration: '45 min' },
            ],
            impls: [
              { title: 'Implementar 2 automações operacionais', type: 'criar', description: 'Automatize relatório e alertas de performance.' },
            ],
          },
          {
            id: 'w6',
            title: 'Semana 6 — Carteira de 3 Clientes',
            goal: 'Chegar a R$6k+',
            revenue: 'R$5.000–R$7.000',
            aulas: [
              { title: 'Retenção e Expansão de Clientes', duration: '35 min' },
            ],
            impls: [
              { title: 'Fechar 3º cliente com ticket maior', type: 'marco', description: 'A cada novo cliente, aumente o preço mínimo.' },
            ],
          },
          { id: 'w7', title: 'Semana 7 — Nicho e Posicionamento', goal: 'Definir especialidade', revenue: 'R$6.000–R$8.000', aulas: [{ title: 'Posicionamento de Agência', duration: '40 min' }], impls: [{ title: 'Escolher nicho primário', type: 'marco', description: 'Especialização é o caminho mais rápido para R$10k.' }] },
          { id: 'w8', title: 'Semana 8 — Processos', goal: 'Documentar tudo', revenue: 'R$7.000–R$9.000', aulas: [{ title: 'SOPs para Agências', duration: '35 min' }], impls: [{ title: 'Documentar todos os processos', type: 'criar', description: 'Prepare o terreno para contratar.' }] },
          { id: 'w9', title: 'Semana 9 — Auditoria Geral', goal: 'Revisar todos os resultados', revenue: 'R$8.000–R$10.000', aulas: [{ title: 'Auditoria de Contas', duration: '40 min' }], impls: [{ title: 'Auditar todas as contas', type: 'fazer', description: 'Revise cada conta e otimize o que está abaixo da meta.' }] },
          { id: 'w10', title: 'Semana 10 — R$10k', goal: 'Consolidar a meta', revenue: 'R$10.000', aulas: [{ title: 'Próximo Nível — R$30k', duration: '45 min' }], impls: [{ title: 'Checkpoint de R$10k', type: 'marco', description: 'Valide o resultado e planeje os próximos 90 dias.' }] },
        ],
      },
    ],
  },

  P2: {
    profileId: 'P2',
    profileName: 'Praticante Travado',
    aulaCount: 30,
    diagnosticText:
      'Você estudou bastante mas ainda não fechou o primeiro cliente. Esse não é um problema técnico — é um problema de ação. O plano desta semana começa pela prospecção, não pela teoria.',
    phases: [
      {
        id: 'fase1',
        title: 'Fase 1 — Desbloqueio Comercial',
        weeks: [
          {
            id: 'w1',
            title: 'Semana 1 — Ação Imediata',
            goal: 'Sair da paralisia e prospectar com método',
            revenue: 'R$0 → 1ª reunião agendada',
            aulas: [
              { title: 'Por Que Gestores Não Fecham Clientes', duration: '30 min' },
              { title: 'Prospecção com Método — Sistema A/B/C', duration: '45 min' },
              { title: 'A Reunião de Fechamento', duration: '35 min' },
            ],
            impls: [
              {
                title: 'Enviar 10 DMs hoje',
                type: 'fazer',
                description: 'Não amanhã. Agora. Use o modelo de abordagem e mande 10 mensagens antes de dormir.',
                context: 'O maior erro de quem sabe a teoria é não agir. Essa semana é sobre volume.',
              },
              {
                title: 'Prospecção: 5 DMs/dia',
                type: 'rotina',
                description: 'Todos os dias, sem exceção. Antes de estudar qualquer outra coisa.',
              },
              {
                title: 'Agendar 2 reuniões',
                type: 'marco',
                description: 'Meta da semana: ao menos 2 reuniões agendadas. Se não conseguir, revise a abordagem.',
              },
            ],
          },
        ],
      },
    ],
  },

  P3: {
    profileId: 'P3',
    profileName: 'Em Operação Inicial',
    aulaCount: 35,
    diagnosticText:
      'Você já tem clientes — agora é hora de fazer os resultados melhorarem e fechar mais. O plano começa direto na otimização e no processo comercial para escalar de onde você está para R$10k.',
    phases: [
      {
        id: 'fase1',
        title: 'Fase 1 — Otimização e Expansão',
        weeks: [
          {
            id: 'w1',
            title: 'Semana 1 — Auditoria dos Clientes Atuais',
            goal: 'Melhorar resultados dos clientes existentes',
            revenue: 'Consolidar faturamento atual',
            aulas: [
              { title: 'Auditoria de Contas — Metodologia', duration: '40 min' },
              { title: 'Otimização Avançada de Campanhas', duration: '50 min' },
              { title: 'Métricas que Realmente Importam', duration: '35 min' },
            ],
            impls: [
              {
                title: 'Auditar todas as contas dos clientes',
                type: 'fazer',
                description: 'Revise cada conta: estrutura, criativos, públicos, CPL, ROAS. Identifique os maiores gargalos.',
              },
              {
                title: 'Implementar otimizações prioritárias',
                type: 'fazer',
                description: 'Para cada conta: corrija o principal problema identificado na auditoria.',
              },
              {
                title: 'Reunião de resultado com cada cliente',
                type: 'rotina',
                description: 'Apresente os resultados e o que foi melhorado. Reforce o valor entregue.',
              },
            ],
          },
        ],
      },
    ],
  },

  P4: {
    profileId: 'P4',
    profileName: 'Crescendo',
    aulaCount: 28,
    diagnosticText:
      'Você está perto. O plano foca em IA para ganhar velocidade, relatórios para reter clientes, e processos para escalar sem aumentar horas trabalhadas.',
    phases: [
      {
        id: 'fase1',
        title: 'Fase 1 — Eficiência e Escala',
        weeks: [
          {
            id: 'w1',
            title: 'Semana 1 — IA e Automações Avançadas',
            goal: 'Dobrar eficiência operacional com IA',
            revenue: 'Consolidar faturamento atual',
            aulas: [
              { title: 'Agentes de IA para Gestores', duration: '55 min' },
              { title: 'Automações Avançadas com n8n', duration: '60 min' },
              { title: 'Advantage+ Avançado', duration: '45 min' },
            ],
            impls: [
              { title: 'Mapear todas as tarefas repetitivas', type: 'fazer', description: 'Liste tudo que você faz manualmente e que poderia ser automatizado.' },
              { title: 'Implementar 3 automações críticas', type: 'criar', description: 'Relatório, alertas de performance e onboarding automatizados.' },
            ],
          },
        ],
      },
    ],
  },

  P5: {
    profileId: 'P5',
    profileName: 'Escala',
    aulaCount: 20,
    diagnosticText:
      'Você já chegou ao 10k — o próximo nível é o 30k. O plano foca em estrutura de agência, automações operacionais e estratégias avançadas de escala de carteira.',
    phases: [
      {
        id: 'fase1',
        title: 'Fase 1 — Escala Estrutural',
        weeks: [
          {
            id: 'w1',
            title: 'Semana 1 — Estrutura para R$30k',
            goal: 'Reorganizar a agência para o próximo nível',
            revenue: 'R$10k+ consolidado',
            aulas: [
              { title: 'Escala de Agência — R$10k ao R$30k', duration: '60 min' },
              { title: 'Agentes de IA na Operação', duration: '55 min' },
              { title: 'Gestão de Equipe de Tráfego', duration: '45 min' },
            ],
            impls: [
              { title: 'Mapear gargalos para o próximo nível', type: 'fazer', description: 'O que te impede de dobrar o faturamento sem dobrar as horas?' },
              { title: 'Definir estrutura de equipe', type: 'criar', description: 'Monte o organograma ideal para R$30k e identifique a próxima contratação.' },
              { title: 'Implementar workflow de IA completo', type: 'criar', description: 'Agente de IA para geração de relatórios, copies e análise de métricas.' },
            ],
          },
        ],
      },
    ],
  },
}
