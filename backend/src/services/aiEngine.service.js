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

function buildCommercialInstructions() {
  return `
Você é a MotoLead AI, uma consultora comercial especialista em vendas de motos Yamaha.

Seu papel:
- Ajudar vendedores a prospectar.
- Criar mensagens reais para WhatsApp.
- Gerar follow-ups personalizados.
- Recuperar leads parados.
- Responder objeções.
- Criar ideias de conteúdo comercial.
- Agir como gerente comercial prática.

Tom:
- Humano.
- Consultivo.
- Direto.
- Brasileiro.
- Natural para WhatsApp.
- Sem parecer robô.
- Sem exagero.
- Sem prometer aprovação de crédito.
- Sem inventar condições, taxas, parcelas ou promoções.

Regras:
- Use os dados fornecidos.
- Se faltar informação, não invente.
- Sempre gere textos prontos para uso comercial.
- Evite mensagens longas demais.
- Use linguagem simples.
`
}

function buildLeadContext(lead = {}) {
  const safeLead =
    lead || {}

  return `
DADOS DO LEAD:
Nome/Empresa: ${safeLead.company_name || "Não informado"}
Responsável: ${safeLead.responsible || "Não informado"}
Cidade: ${safeLead.city || "Não informada"}
Telefone: ${safeLead.phone || safeLead.whatsapp || "Não informado"}
Status: ${safeLead.status || "Não informado"}
Interesse: ${safeLead.interest || "Não informado"}
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
      .slice(0, 10)
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
Criar uma primeira mensagem de WhatsApp para iniciar conversa com o lead.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "reason": "..."
}
`

    case "followup":
      return `
OBJETIVO:
Criar uma mensagem de follow-up para retomar contato sem parecer insistente.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "reason": "..."
}
`

    case "recovery":
      return `
OBJETIVO:
Criar uma mensagem para recuperar um lead parado há vários dias.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "reason": "..."
}
`

    case "simulation":
      return `
OBJETIVO:
Criar uma mensagem convidando o lead para fazer uma simulação.

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "reason": "..."
}
`

    case "objection":
      return `
OBJETIVO:
Responder uma objeção comercial do cliente.

OBJEÇÃO:
${extra.objection || "Cliente achou caro ou ficou em dúvida."}

Retorne JSON:
{
  "title": "...",
  "message": "...",
  "reason": "..."
}
`

    case "content":
      return `
OBJETIVO:
Criar conteúdo comercial para redes sociais/status de WhatsApp.

TEMA:
${extra.topic || "Moto Yamaha para trabalho e economia"}

Retorne JSON:
{
  "title": "...",
  "caption": "...",
  "status_text": "...",
  "video_script": "...",
  "cta": "...",
  "reason": "..."
}
`

    case "daily_manager":
      return `
OBJETIVO:
Agir como uma gestora comercial e orientar o vendedor sobre o que fazer hoje.

Retorne JSON:
{
  "title": "...",
  "advice": "...",
  "actions": ["...", "...", "..."],
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

async function generateAIResponse({
  objective,
  lead,
  actions = [],
  extra = {}
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não configurada")
  }

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
}

module.exports = {
  generateAIResponse
}