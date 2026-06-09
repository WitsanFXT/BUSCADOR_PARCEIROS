const openai =
  require("../config/openai")

const DEFAULT_MODEL =
  process.env.OPENAI_MODEL || "gpt-5.5"

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function normalizeText(value, fallback = "") {
  return value || fallback
}

function firstName(value) {
  if (!value) return ""
  return String(value).trim().split(" ")[0]
}

function buildCommercialInstructions() {
  return `
Você é a MotoLead AI, uma consultora comercial especialista em vendas de motos Yamaha, prospecção ativa, recuperação de leads, conteúdo comercial e gestão de vendedores.

Você trabalha dentro do sistema MotoLead Pro.

Seu papel:
- Ajudar vendedores a vender mais motos.
- Criar mensagens reais para WhatsApp.
- Gerar follow-ups personalizados.
- Recuperar leads parados.
- Responder objeções de clientes.
- Criar conteúdos para Instagram, WhatsApp Status, Facebook e Reels.
- Dar ideias de prospecção ativa.
- Sugerir plano comercial diário.
- Agir como uma gerente comercial prática, direta e focada em resultado.

Tom:
- Humano.
- Brasileiro.
- Consultivo.
- Natural para WhatsApp.
- Direto.
- Comercial, mas sem parecer forçado.
- Próximo, mas profissional.
- Sem parecer robô.
- Sem textos longos demais.

Regras importantes:
- Use os dados fornecidos.
- Se faltar informação, não invente.
- Não prometa aprovação de crédito.
- Não invente taxas, parcelas, bônus ou campanhas.
- Não diga que existe promoção se isso não foi informado.
- Não pressione o cliente de forma agressiva.
- Priorize clareza, confiança e próxima ação.
- Sempre gere textos prontos para copiar e usar.
- Sempre retorne JSON válido.
`
}

function buildLeadContext(lead = {}) {
  const safeLead =
    lead || {}

  return `
DADOS DO LEAD:
Nome/Empresa: ${safeLead.company_name || "Não informado"}
Responsável: ${safeLead.responsible || "Não informado"}
Primeiro nome: ${firstName(safeLead.responsible || safeLead.company_name) || "Não informado"}
Cidade: ${safeLead.city || "Não informada"}
Telefone: ${safeLead.phone || safeLead.whatsapp || "Não informado"}
Status: ${safeLead.status || "Não informado"}
Interesse: ${safeLead.interest || "Não informado"}
Prioridade: ${safeLead.priority || "Não informada"}
Score: ${safeLead.lead_score || 0}
Temperatura: ${safeLead.lead_temperature || "Frio"}
Moto atual: ${safeLead.current_motorcycle || "Não informada"}
Ano da moto: ${safeLead.motorcycle_year || "Não informado"}
KM: ${safeLead.mileage || "Não informado"}
Uso profissional: ${safeLead.professional_use ? "Sim" : "Não"}
Origem: ${safeLead.lead_source || "Não informada"}
Prazo de compra: ${safeLead.purchase_timeline || "Não informado"}
Observações: ${safeLead.notes || "Nenhuma"}
`
}

function buildHistoryContext(actions = []) {
  if (!actions.length) {
    return "HISTÓRICO COMERCIAL: Nenhuma ação registrada."
  }

  const lines =
    actions
      .slice(0, 12)
      .map((action, index) => {
        return `${index + 1}. ${action.action_title || action.action_type} em ${action.created_at}: ${action.message || ""}`
      })
      .join("\n")

  return `
HISTÓRICO COMERCIAL:
${lines}
`
}

function buildObjectivePrompt(objective, extra = {}) {
  switch (objective) {
    case "first_contact":
      return `
OBJETIVO:
Criar 3 opções de primeira mensagem de WhatsApp para iniciar conversa com o lead.

As mensagens devem:
- Ser naturais.
- Não parecer automação.
- Ter abordagem consultiva.
- Terminar com uma pergunta simples.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "variations": ["...", "...", "..."],
  "best_use": "...",
  "reason": "..."
}
`

case "extract_leads":
  return `
OBJETIVO:
Extrair possíveis leads comerciais a partir de um texto colado pelo vendedor.

TEXTO/FONTE:
${extra.text || ""}

FONTE:
${extra.source || "Manual"}

CIDADE BASE:
${extra.city || "Não informada"}

Extraia apenas informações que aparecem no texto ou que podem ser inferidas com segurança.

Retorne JSON:
{
  "title": "...",
  "leads": [
    {
      "name": "...",
      "phone": "...",
      "instagram": "...",
      "city": "...",
      "interest": "...",
      "current_motorcycle": "...",
      "professional_use": false,
      "lead_source": "...",
      "lead_score": 0,
      "reason": "..."
    }
  ],
  "summary": "...",
  "reason": "..."
}
`

case "prediction":
  return `
OBJETIVO:
Analisar a chance comercial deste lead ou cliente do funil.

Avalie:
- Chance de fechamento
- Risco de perder o cliente
- Próxima ação ideal
- Melhor canal
- Melhor abordagem
- Motivo da análise

CONTEXTO EXTRA:
${extra.context || ""}

Retorne JSON:
{
  "title": "...",
  "closing_chance": 0,
  "risk_level": "Baixo | Médio | Alto",
  "next_action": "...",
  "best_channel": "...",
  "best_approach": "...",
  "reason": "..."
}
`

    case "followup":
      return `
OBJETIVO:
Criar uma mensagem de follow-up para retomar contato sem parecer insistente.

A mensagem deve:
- Ser curta.
- Retomar o assunto com leveza.
- Fazer uma pergunta.
- Convidar para uma próxima ação.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "variations": ["...", "..."],
  "best_use": "...",
  "reason": "..."
}
`

    case "recovery":
      return `
OBJETIVO:
Criar uma mensagem para recuperar um lead parado há vários dias.

A mensagem deve:
- Não cobrar o cliente.
- Reabrir conversa com naturalidade.
- Mostrar que existe uma oportunidade.
- Perguntar se ainda faz sentido avaliar.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "variations": ["...", "..."],
  "best_use": "...",
  "reason": "..."
}
`

    case "simulation":
      return `
OBJETIVO:
Criar mensagem convidando o lead para fazer uma simulação.

A mensagem deve:
- Deixar claro que é sem compromisso.
- Falar de entrada, parcela e condição de forma genérica.
- Não prometer aprovação.
- Pedir autorização para montar a simulação.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "variations": ["...", "..."],
  "best_use": "...",
  "reason": "..."
}
`

    case "objection":
      return `
OBJETIVO:
Responder uma objeção comercial do cliente.

OBJEÇÃO:
${extra.objection || "Cliente achou caro ou ficou em dúvida."}

A resposta deve:
- Validar a preocupação do cliente.
- Não discutir.
- Reposicionar valor.
- Sugerir alternativa.
- Terminar com uma pergunta.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "variations": ["...", "..."],
  "best_use": "...",
  "reason": "..."
}
`

    case "closing":
      return `
OBJETIVO:
Criar uma mensagem de fechamento leve.

A mensagem deve:
- Não pressionar.
- Chamar o cliente para uma decisão simples.
- Sugerir próximo passo.
- Ser boa para WhatsApp.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "variations": ["...", "..."],
  "best_use": "...",
  "reason": "..."
}
`

    case "referral":
      return `
OBJETIVO:
Criar mensagem pedindo indicação para cliente, parceiro ou conhecido.

A mensagem deve:
- Ser educada.
- Explicar que buscamos pessoas interessadas em moto Yamaha.
- Facilitar a indicação.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "variations": ["...", "..."],
  "best_use": "...",
  "reason": "..."
}
`

    case "prospecting":
      return `
OBJETIVO:
Gerar ideias práticas de prospecção ativa para vendedor de concessionária Yamaha.

CONTEXTO EXTRA:
${extra.context || ""}

Retorne JSON:
{
  "title": "...",
  "ideas": ["...", "...", "...", "...", "..."],
  "script": "...",
  "where_to_search": ["...", "...", "..."],
  "reason": "..."
}
`

    case "content":
      return `
OBJETIVO:
Criar conteúdo comercial completo para redes sociais/status de WhatsApp.

TEMA:
${extra.topic || "Moto Yamaha para trabalho e economia"}

Retorne JSON:
{
  "title": "...",
  "caption": "...",
  "status_text": "...",
  "video_script": "...",
  "story_sequence": ["...", "...", "..."],
  "hashtags": ["...", "...", "..."],
  "cta": "...",
  "reason": "..."
}
`

    case "stories":
      return `
OBJETIVO:
Criar sequência de stories para WhatsApp/Instagram.

TEMA:
${extra.topic || "Oportunidade Yamaha"}

Retorne JSON:
{
  "title": "...",
  "story_sequence": ["Story 1...", "Story 2...", "Story 3...", "Story 4..."],
  "cta": "...",
  "reason": "..."
}
`

    case "reel":
      return `
OBJETIVO:
Criar roteiro de Reels curto para vender ou gerar interesse.

TEMA:
${extra.topic || "Moto Yamaha"}

Retorne JSON:
{
  "title": "...",
  "hook": "...",
  "video_script": "...",
  "caption": "...",
  "cta": "...",
  "hashtags": ["...", "...", "..."],
  "reason": "..."
}
`

    case "ad":
      return `
OBJETIVO:
Criar texto para anúncio comercial de moto Yamaha.

TEMA:
${extra.topic || "Moto Yamaha"}

Retorne JSON:
{
  "title": "...",
  "primary_text": "...",
  "headline": "...",
  "description": "...",
  "cta": "...",
  "reason": "..."
}
`

    case "daily_manager":
      return `
OBJETIVO:
Agir como uma gestora comercial e orientar o vendedor sobre o que fazer hoje.

CONTEXTO DO SISTEMA:
${extra.system_context || ""}

Retorne JSON:
{
  "title": "...",
  "advice": "...",
  "actions": ["...", "...", "...", "..."],
  "risks": ["...", "..."],
  "opportunities": ["...", "..."],
  "reason": "..."
}
`

    case "strategy":
      return `
OBJETIVO:
Criar uma estratégia comercial prática para aumentar vendas.

CONTEXTO:
${extra.context || ""}

Retorne JSON:
{
  "title": "...",
  "strategy": "...",
  "actions": ["...", "...", "...", "..."],
  "metrics_to_watch": ["...", "...", "..."],
  "reason": "..."
}
`

    case "chat":
      return `
OBJETIVO:
Responder como uma assistente comercial real dentro do MotoLead Pro.

PERGUNTA DO VENDEDOR:
${extra.message || ""}

CONTEXTO DO SISTEMA:
${extra.system_context || ""}

Responda de forma prática, direta e consultiva.
Quando fizer sentido, indique próximas ações.

Retorne JSON:
{
  "title": "...",
  "answer": "...",
  "suggested_actions": ["...", "...", "..."],
  "reason": "..."
}
`

    default:
      return `
OBJETIVO:
Gerar uma resposta comercial útil para o vendedor.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "reason": "..."
}
`
  }
}

function fallbackName(lead = {}) {
  return (
    firstName(lead?.responsible) ||
    firstName(lead?.company_name) ||
    ""
  )
}

function fallbackMoto(lead = {}) {
  return lead?.current_motorcycle || "sua moto atual"
}

function fallbackCity(lead = {}) {
  return lead?.city || "sua região"
}

function generateFallbackResponse({
  objective,
  lead = {},
  extra = {}
}) {
  const safeLead =
    lead || {}

  const name =
    fallbackName(safeLead)

  const moto =
    fallbackMoto(safeLead)

  const city =
    fallbackCity(safeLead)

  const greeting =
    name
      ? `Olá ${name}, tudo bem?`
      : "Olá, tudo bem?"

  if (objective === "first_contact") {
    const message =
      `${greeting} Sou da Yamaha e queria entender melhor seu momento. Vi que você pode ter interesse em moto e posso te ajudar a encontrar uma opção que faça sentido para sua rotina. Hoje você está usando ${moto}?`

    return {
      title: "Primeiro contato",
      message,
      variations: [
        `${greeting} tudo certo? Estou entrando em contato para entender se você ainda avalia uma oportunidade de moto Yamaha. Posso te fazer uma pergunta rápida?`,
        `${greeting} vi seu perfil aqui e queria entender se hoje você pensa em trocar ou comprar uma moto. Posso te mostrar algumas opções sem compromisso?`,
        `${greeting} sou da Yamaha. Estou falando com algumas pessoas de ${city} que usam moto no dia a dia. Você hoje já tem uma moto ou está procurando uma?`
      ],
      best_use:
        "Use quando o lead ainda não recebeu contato comercial.",
      reason:
        "Mensagem gerada em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "extract_leads") {
  const text =
    extra?.text || ""

  const city =
    extra?.city || ""

  const source =
    extra?.source || "Manual"

  return {
    title: "Leads extraídos",
    leads: [
      {
        name: "Lead identificado no texto",
        phone: "",
        instagram: "",
        city,
        interest: text.slice(0, 120),
        current_motorcycle: "",
        professional_use: text.toLowerCase().includes("entrega") ||
          text.toLowerCase().includes("motoboy") ||
          text.toLowerCase().includes("trabalho"),
        lead_source: source,
        lead_score: 50,
        reason:
          "Lead gerado em modo fallback. Ative a IA real para extração mais precisa."
      }
    ],
    summary:
      "Extração feita em modo fallback.",
    reason:
      "Fallback ativo até a IA real processar o texto com mais precisão."
  }
}

  if (objective === "followup") {
    const message =
      `${greeting} passando para retomar nosso contato. Você ainda está avaliando uma oportunidade para trocar de moto? Posso te mostrar algumas opções da Yamaha que fazem sentido para seu perfil.`

    return {
      title: "Follow-up automático",
      message,
      variations: [
        `${greeting} tudo bem? Só passando para saber se ainda faz sentido conversarmos sobre uma opção de moto para você.`,
        `${greeting} queria retomar nossa conversa. Você ainda está com interesse em avaliar uma condição sem compromisso?`
      ],
      best_use:
        "Use quando já houve contato anterior, mas o cliente não avançou.",
      reason:
        "Mensagem gerada em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "recovery") {
    const message =
      `${greeting} faz um tempinho que não nos falamos. Queria retomar nossa conversa e ver se ainda faz sentido avaliar uma condição para você sair da ${moto} e conhecer uma opção Yamaha mais nova.`

    return {
      title: "Recuperação de lead",
      message,
      variations: [
        `${greeting} tudo bem? Vi aqui que nossa conversa ficou parada. Ainda faz sentido eu te mostrar alguma condição de moto Yamaha?`,
        `${greeting} passando para reativar nosso contato. Se ainda estiver pensando em moto, posso te ajudar com uma simulação sem compromisso.`
      ],
      best_use:
        "Use com leads quentes que ficaram vários dias sem contato.",
      reason:
        "Mensagem gerada em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "simulation") {
    const message =
      `${name ? `${name}, ` : ""}posso montar uma simulação sem compromisso para você avaliar entrada, parcela e melhor condição disponível. Assim você consegue ver se a troca faz sentido agora.`

    return {
      title: "Convite para simulação",
      message,
      variations: [
        `${greeting} quer que eu monte uma simulação para você ver valores aproximados e possibilidades sem compromisso?`,
        `${name ? `${name}, ` : ""}se quiser, eu faço uma simulação simples para você comparar e decidir com calma.`
      ],
      best_use:
        "Use quando o lead demonstrou interesse, mas ainda não recebeu proposta.",
      reason:
        "Mensagem gerada em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "objection") {
    const objection =
      extra?.objection ||
      "Cliente achou caro ou ficou em dúvida."

    const message =
      `Entendo sua preocupação. A ideia não é te empurrar uma moto, mas encontrar uma condição que caiba no seu orçamento. Podemos ajustar entrada, prazo e modelo para chegar em algo mais confortável. Quer que eu veja uma alternativa melhor para você?`

    return {
      title: `Resposta para objeção: ${objection}`,
      message,
      variations: [
        `Faz sentido você avaliar com calma. O que posso fazer é te mostrar opções diferentes para encontrar algo mais confortável. Quer que eu simule outro cenário?`,
        `Entendo. Às vezes mudando entrada, prazo ou modelo já conseguimos uma condição mais alinhada. Quer que eu confira uma alternativa?`
      ],
      best_use:
        "Use quando o cliente disser que está caro, vai pensar ou ficou inseguro.",
      reason:
        "Mensagem gerada em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "prediction") {
  const score =
    lead?.lead_score || 0

  let closingChance = 35
  let riskLevel = "Médio"
  let nextAction = "Fazer follow-up consultivo"
  let bestApproach = "Entender o momento do cliente e oferecer simulação sem compromisso"

  if (score >= 80) {
    closingChance = 82
    riskLevel = "Baixo"
    nextAction = "Enviar simulação hoje"
    bestApproach = "Abordagem direta com foco em condição, troca e próxima etapa"
  } else if (score >= 70) {
    closingChance = 70
    riskLevel = "Médio"
    nextAction = "Fazer contato hoje"
    bestApproach = "Abordagem consultiva com convite para simulação"
  } else if (score >= 40) {
    closingChance = 48
    riskLevel = "Médio"
    nextAction = "Nutrir relacionamento"
    bestApproach = "Entender necessidade antes de ofertar"
  } else {
    closingChance = 25
    riskLevel = "Alto"
    nextAction = "Coletar mais informações"
    bestApproach = "Descobrir interesse, prazo e modelo desejado"
  }

  return {
    title: "Análise preditiva comercial",
    closing_chance: closingChance,
    risk_level: riskLevel,
    next_action: nextAction,
    best_channel: "WhatsApp",
    best_approach: bestApproach,
    reason:
      "Análise gerada em modo fallback com base no score e dados disponíveis."
  }
}

  if (objective === "closing") {
    const message =
      `${name ? `${name}, ` : ""}quer que eu veja uma condição hoje e te mande uma simulação simples para você avaliar com calma?`

    return {
      title: "Fechamento leve",
      message,
      variations: [
        `${name ? `${name}, ` : ""}se fizer sentido para você, posso deixar uma simulação pronta ainda hoje.`,
        `${greeting} posso avançar e montar uma condição para você comparar?`
      ],
      best_use:
        "Use quando o cliente já demonstrou interesse e falta avançar para simulação.",
      reason:
        "Mensagem gerada em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "referral") {
    const message =
      `${greeting} estou buscando pessoas que estejam pensando em trocar ou comprar uma moto Yamaha. Se você conhecer alguém que usa moto para trabalho ou está avaliando uma troca, pode me indicar? Eu atendo com calma e sem compromisso.`

    return {
      title: "Pedido de indicação",
      message,
      variations: [
        `${greeting} conhece alguém que esteja precisando de moto ou pensando em trocar? Se puder me indicar, eu agradeço muito.`,
        `${greeting} estou ajudando alguns clientes a encontrar boas opções Yamaha. Se lembrar de alguém, pode me passar o contato?`
      ],
      best_use:
        "Use com clientes, parceiros, oficinas, empresas e contatos antigos.",
      reason:
        "Mensagem gerada em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "prospecting") {
    return {
      title: "Plano de prospecção ativa",
      ideas: [
        "Buscar motoboys e entregadores em grupos locais de Facebook e WhatsApp.",
        "Mapear empresas que usam moto para entrega em Unaí e região.",
        "Conversar com oficinas sobre clientes com motos antigas ou alta quilometragem.",
        "Abordar pessoas vendendo moto usada no Marketplace.",
        "Criar lista de autoescolas e prestadores de serviço que usam moto."
      ],
      script:
        "Olá, tudo bem? Trabalho com Yamaha e estou mapeando pessoas que usam moto no dia a dia. Queria entender se hoje você pensa em trocar, comprar ou apenas avaliar uma condição sem compromisso.",
      where_to_search: [
        "Facebook Marketplace",
        "Grupos de entregadores",
        "Instagram local",
        "Oficinas",
        "Autoescolas",
        "Empresas de entrega"
      ],
      reason:
        "Ideias geradas em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "content") {
    const topic =
      extra?.topic ||
      "moto Yamaha para trabalho e economia"

    return {
      title:
        `Conteúdo: ${topic}`,
      caption:
        `Você que usa moto no dia a dia sabe como economia, conforto e confiança fazem diferença. Uma Yamaha pode ser a parceira ideal para trabalhar melhor, gastar menos e ter mais tranquilidade na rotina.`,
      status_text:
        `Trabalha de moto? Vamos conversar sobre uma Yamaha que combina economia, confiança e custo-benefício. Faço uma simulação sem compromisso.`,
      video_script:
        `Mostre uma moto Yamaha na loja. Fale: "Se você trabalha de moto, sabe que economia e confiança fazem diferença. Hoje eu posso te ajudar a encontrar uma opção que faça sentido para sua rotina e seu bolso."`,
      story_sequence: [
        "Story 1: Você usa moto para trabalhar?",
        "Story 2: Economia e confiança fazem diferença no fim do mês.",
        "Story 3: Temos opções Yamaha para quem precisa de moto no dia a dia.",
        "Story 4: Me chama e eu faço uma simulação sem compromisso."
      ],
      hashtags: [
        "#Yamaha",
        "#Moto",
        "#Motoboy",
        "#Unaí",
        "#Economia"
      ],
      cta:
        "Me chama no WhatsApp e eu faço uma simulação sem compromisso.",
      reason:
        "Conteúdo gerado em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "stories") {
    const topic =
      extra?.topic || "Oportunidade Yamaha"

    return {
      title:
        `Stories: ${topic}`,
      story_sequence: [
        "Story 1: Está pensando em trocar de moto?",
        "Story 2: Uma moto econômica pode fazer diferença no seu mês.",
        "Story 3: A Yamaha tem opções para trabalho, cidade e dia a dia.",
        "Story 4: Me chama aqui que eu faço uma simulação sem compromisso."
      ],
      cta:
        "Responder este status ou chamar no WhatsApp.",
      reason:
        "Stories gerados em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "reel") {
    const topic =
      extra?.topic || "Moto Yamaha"

    return {
      title:
        `Reels: ${topic}`,
      hook:
        "Você que trabalha de moto precisa ouvir isso.",
      video_script:
        "Cena 1: vendedor ao lado da moto. Fala: 'Você que trabalha de moto sabe que cada real conta.' Cena 2: mostrar detalhes da moto. Fala: 'Economia, conforto e confiança fazem diferença no fim do mês.' Cena 3: chamada final: 'Me chama que eu faço uma simulação sem compromisso.'",
      caption:
        "Para quem usa moto todos os dias, escolher bem faz diferença. Me chama e veja uma opção Yamaha para sua rotina.",
      cta:
        "Chamar no WhatsApp para simulação.",
      hashtags: [
        "#Yamaha",
        "#Moto",
        "#Trabalho",
        "#Motoboy"
      ],
      reason:
        "Roteiro gerado em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "ad") {
    const topic =
      extra?.topic || "Moto Yamaha"

    return {
      title:
        `Anúncio: ${topic}`,
      primary_text:
        "Está pensando em trocar ou comprar uma moto? Conheça opções Yamaha para o dia a dia, trabalho e economia. Faça uma simulação sem compromisso.",
      headline:
        "Sua próxima Yamaha pode estar mais perto do que você imagina",
      description:
        "Fale com um consultor e veja opções para sua rotina.",
      cta:
        "Chamar no WhatsApp",
      reason:
        "Anúncio gerado em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "daily_manager") {
    return {
      title:
        "Plano comercial do dia",
      advice:
        "Comece pelos leads quentes, resolva follow-ups pendentes, recupere leads parados e depois gere novas conversas no Radar de Oportunidades.",
      actions: [
        "Falar com os 3 leads de maior score.",
        "Resolver follow-ups vencidos.",
        "Recuperar leads quentes parados.",
        "Gerar 10 novas conversas no Radar.",
        "Publicar um status comercial com CTA."
      ],
      risks: [
        "Leads quentes podem esfriar se não houver contato rápido.",
        "Follow-ups vencidos reduzem chance de fechamento."
      ],
      opportunities: [
        "Usar motoboys e empresas locais como fonte de prospecção.",
        "Publicar conteúdo de economia e trabalho com moto."
      ],
      reason:
        "Orientação gerada em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "strategy") {
    return {
      title:
        "Estratégia comercial prática",
      strategy:
        "Concentre a energia primeiro nos leads quentes, depois em recuperação, depois em prospecção ativa por cidade e perfil profissional.",
      actions: [
        "Separar leads com score acima de 70.",
        "Enviar mensagem personalizada para cada um.",
        "Criar lista de motoboys e empresas locais.",
        "Publicar conteúdo diário com chamada para simulação.",
        "Registrar cada ação no histórico comercial."
      ],
      metrics_to_watch: [
        "Leads quentes contatados",
        "Follow-ups concluídos",
        "Simulações enviadas",
        "Leads recuperados",
        "Conversas novas por dia"
      ],
      reason:
        "Estratégia gerada em modo fallback até a IA real ser ativada."
    }
  }

  if (objective === "chat") {
    const message =
      extra?.message || ""

    return {
      title: "Resposta da Assistente",
      answer:
        `Pelo que vejo no MotoLead Pro, eu começaria pelos leads quentes, resolveria os follow-ups pendentes e depois criaria novas conversas no Radar. Sobre sua pergunta: "${message}", minha sugestão é agir primeiro nos contatos com maior score, recuperar quem está parado e registrar cada ação.`,
      suggested_actions: [
        "Ver Prioridades IA",
        "Resolver Follow-ups",
        "Recuperar Leads Parados",
        "Criar novas oportunidades no Radar",
        "Gerar conteúdo comercial"
      ],
      reason:
        "Resposta gerada em modo fallback até a IA real ser ativada."
    }
  }

  return {
    title:
      "Mensagem comercial",
    message:
      `${greeting} estou passando para falar sobre uma oportunidade da Yamaha que pode fazer sentido para você em ${city}. Posso te mostrar algumas opções sem compromisso?`,
    reason:
      "Mensagem gerada em modo fallback até a IA real ser ativada."
  }
}

async function generateAIResponse({
  objective,
  lead,
  actions = [],
  extra = {}
}) {
  if (!process.env.OPENAI_API_KEY) {
    return generateFallbackResponse({
      objective,
      lead,
      extra
    })
  }

  try {
    const input = `
${buildCommercialInstructions()}

${buildLeadContext(lead)}

${buildHistoryContext(actions)}

${buildObjectivePrompt(objective, extra)}
`

    const response =
      await openai.responses.create({
        model: DEFAULT_MODEL,
        input
      })

    const text =
      response.output_text || ""

    const parsed =
      safeJsonParse(text)

    if (parsed) return parsed

    return {
      title: "Resposta gerada pela IA",
      message: text,
      reason:
        "A IA retornou texto livre em vez de JSON estruturado."
    }

  } catch (err) {
    console.log(
      "IA real indisponível, usando fallback:",
      err.message
    )

    return generateFallbackResponse({
      objective,
      lead,
      extra
    })
  }
}

module.exports = {
  generateAIResponse
}