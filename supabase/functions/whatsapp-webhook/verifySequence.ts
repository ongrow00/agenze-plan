/** Sequência após “Verificar Conta” (resposta rápida). `{nome}` e `{email}` são preenchidos no handler. */

export const BETWEEN_SEQUENCE_MS = 5000

export function buildVerifySequenceMessages(ctx: { nome: string; email: string | null }): string[] {
  const { nome, email } = ctx
  const emailLead = email
    ? `O primeiro passo é acessar o e-mail (${email}) que enviamos para você.`
    : `O primeiro passo é acessar o e-mail que você usou na compra. É para esse endereço que enviamos o link.`

  return [
    `${nome}, sua conta na Agenze foi verificada com sucesso!

Agora você já pode acessar tudo com tranquilidade e começar sua jornada. 
Vamos juntos passo a passo 🚀`,

    `✅ Passo 1 — Criar sua senha de acesso

${emailLead}
Lá você vai encontrar o link para criar sua senha de acesso.

👉 Depois de criar sua senha, você já pode entrar normalmente por aqui:
https://app.agenze.io/

⚠️ Importante: antes de tentar entrar na plataforma, é necessário criar sua senha pelo link recebido no e-mail.`,

    `🎬 Passo 2 — Assista este vídeo antes de começar

Preparamos um vídeo rápido e muito importante para você entender como tudo funciona e aproveitar melhor a plataforma desde o início.

👉 Assista aqui:
https://app.agenze.io/c/veja-isso-antes-de-comecar/`,

    `🚀 Passo 3 — Acesse o seu Plano 10K personalizado

Seu plano 10K já está pronto esperando por você.

👉 Acesse diretamente aqui:
https://app.agenze.io/c/seu-plano-10k-personalizado-esta-aqui/`,

    `💬 Precisa de ajuda? Estamos aqui com você

Se tiver qualquer dúvida, feedback, sugestão ou encontrar algo que não funcione como esperado, pode falar com a gente no WhatsApp.

👉 https://wa.me/555195653371

Vai ser um prazer te ajudar 🙂`,
  ]
}
