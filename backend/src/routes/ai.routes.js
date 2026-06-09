const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

function clean(value, fallback = "") {
  return value || fallback
}

function getFirstName(name) {
  if (!name) return ""
  return name.trim().split(" ")[0]
}

function getMotorcycleProfile(lead) {
  const parts = []

  if (lead.current_motorcycle) {
    parts.push(lead.current_motorcycle)
  }

  if (lead.motorcycle_year) {
    parts.push(`ano ${lead.motorcycle_year}`)
  }

  if (lead.mileage) {
    parts.push(`${lead.mileage} km`)
  }

  return parts.length
    ? parts.join(", ")
    : "sua moto atual"
}

function getLeadContext(lead) {
  const name =
    getFirstName(lead.responsible) ||
    getFirstName(lead.company_name)

  const moto =
    getMotorcycleProfile(lead)

  const city =
    clean(lead.city, "sua região")

  const score =
    lead.lead_score || 0

  const temperature =
    lead.lead_temperature || "Frio"

  const professional =
    lead.professional_use

  const timeline =
    lead.purchase_timeline || "Sem previsão"

  return {
    name,
    moto,
    city,
    score,
    temperature,
    professional,
    timeline
  }
}

function getOpeningByTemperature(ctx) {
  if (ctx.temperature === "Quente") {
    return "Vi que seu perfil está bem próximo de uma troca."
  }

  if (ctx.temperature === "Morno") {
    return "Vi que talvez faça sentido avaliar uma troca nos próximos meses."
  }

  return "Queria entender melhor seu momento e ver se consigo te ajudar com uma boa oportunidade."
}

function getProfessionalAngle(ctx) {
  if (!ctx.professional) return ""

  return " Como você usa a moto para trabalho, o mais importante é reduzir custo, evitar parada e ter uma moto confiável no dia a dia."
}

function getTimelineAngle(ctx) {
  if (
    ctx.timeline === "Imediato" ||
    ctx.timeline === "Até 30 dias"
  ) {
    return " Como sua intenção é para breve, vale a pena olhar as condições atuais."
  }

  if (ctx.timeline === "Até 90 dias") {
    return " Mesmo que seja para os próximos meses, já dá para planejar entrada, parcela e melhor momento da troca."
  }

  return ""
}

function buildMessages(lead) {
  const ctx = getLeadContext(lead)

  const greeting =
    ctx.name
      ? `Olá ${ctx.name}, tudo bem?`
      : "Olá, tudo bem?"

  const opening =
    getOpeningByTemperature(ctx)

  const professionalAngle =
    getProfessionalAngle(ctx)

  const timelineAngle =
    getTimelineAngle(ctx)

  return [
    {
      type: "first_contact",
      title: "Primeiro Contato Personalizado",
      message:
        `${greeting} ${opening} Vi que você utiliza ${ctx.moto} em ${ctx.city}.${professionalAngle}${timelineAngle} Posso te mostrar algumas opções da Yamaha que podem fazer sentido para você?`
    },
    {
      type: "followup",
      title: "Follow-up Consultivo",
      message:
        `${greeting} passando para retomar nosso contato. Você ainda está com ${ctx.moto}? Posso montar uma condição de troca para você comparar com calma.`
    },
    {
      type: "simulation",
      title: "Convite para Simulação",
      message:
        `${ctx.name ? `${ctx.name}, ` : ""}posso montar uma simulação sem compromisso considerando seu perfil, possível entrada e melhor opção de parcela. Assim você consegue ver se a troca faz sentido agora.`
    },
    {
      type: "objection_price",
      title: "Objeção: Preço ou Parcela",
      message:
        "Entendo sua preocupação. A ideia não é te empurrar uma moto, é encontrar uma condição que caiba no seu bolso. Podemos ajustar entrada, prazo e modelo para chegar em uma parcela mais confortável."
    },
    {
      type: "trade_argument",
      title: "Argumento de Troca",
      message:
        `Pelo perfil da sua moto atual (${ctx.moto}), pode ser interessante avaliar a troca antes que manutenção, pneus, relação ou desvalorização pesem mais. Posso fazer uma análise rápida para você.`
    },
    {
      type: "closing",
      title: "Fechamento Leve",
      message:
        `${ctx.name ? `${ctx.name}, ` : ""}quer que eu veja uma condição hoje e te mande uma simulação simples pelo WhatsApp?`
    }
  ]
}

function getRecommendationAction(lead) {
  const score = lead.lead_score || 0
  const temperature = lead.lead_temperature || "Frio"
  const timeline = lead.purchase_timeline || "Sem previsão"
  const status = lead.status || ""
  const professional = lead.professional_use

  if (timeline === "Imediato" && score >= 70) {
    return {
      priority: 1,
      action: "Ligar hoje",
      reason: "Lead quente com intenção imediata de compra."
    }
  }

  if (status === "Negociando" && score >= 70) {
    return {
      priority: 2,
      action: "Enviar proposta",
      reason: "Lead em negociação com score alto."
    }
  }

  if (score >= 80) {
    return {
      priority: 3,
      action: "Enviar simulação",
      reason: "Lead com alto potencial de conversão."
    }
  }

  if (professional && score >= 60) {
    return {
      priority: 4,
      action: "Oferecer troca com foco em trabalho",
      reason:
        "Lead usa moto profissionalmente e pode valorizar economia, confiabilidade e produtividade."
    }
  }

  if (
    timeline === "Até 30 dias" ||
    timeline === "Até 90 dias"
  ) {
    return {
      priority: 5,
      action: "Fazer follow-up consultivo",
      reason: "Lead possui prazo definido para possível compra."
    }
  }

  if (temperature === "Morno" || score >= 40) {
    return {
      priority: 6,
      action: "Nutrir relacionamento",
      reason: "Lead ainda não está pronto, mas possui potencial futuro."
    }
  }

  return {
    priority: 7,
    action: "Manter no radar",
    reason: "Lead frio ou com pouca informação comercial."
  }
}

function daysBetween(date) {
  if (!date) return 999

  const lastDate =
    new Date(date)

  const now =
    new Date()

  return Math.floor(
    (now - lastDate) /
    (1000 * 60 * 60 * 24)
  )
}

function getFollowupLevel(daysWithoutContact, lead) {
  const score =
    lead.lead_score || 0

  const temperature =
    lead.lead_temperature || "Frio"

  if (
    daysWithoutContact >= 7 &&
    score >= 70
  ) {
    return {
      level: "CRITICO",
      priority: 1,
      recommendation:
        "Entrar em contato imediatamente",
      reason:
        "Lead quente está há 7 dias ou mais sem ação comercial."
    }
  }

  if (
    daysWithoutContact >= 7
  ) {
    return {
      level: "CRITICO",
      priority: 2,
      recommendation:
        "Recuperar lead parado",
      reason:
        "Lead está há 7 dias ou mais sem contato registrado."
    }
  }

  if (
    daysWithoutContact >= 3 &&
    (
      temperature === "Quente" ||
      score >= 70
    )
  ) {
    return {
      level: "ATENCAO",
      priority: 3,
      recommendation:
        "Fazer follow-up hoje",
      reason:
        "Lead com bom potencial está há 3 dias ou mais sem ação."
    }
  }

  if (
    daysWithoutContact >= 3
  ) {
    return {
      level: "ATENCAO",
      priority: 4,
      recommendation:
        "Retomar conversa",
      reason:
        "Lead está há alguns dias sem movimentação."
    }
  }

  return {
    level: "OK",
    priority: 5,
    recommendation:
      "Acompanhamento em dia",
    reason:
      "Lead possui ação comercial recente."
  }
}

router.post("/conversion-message", async (req, res) => {
  try {
    const lead = req.body

    const messages =
      buildMessages(lead)

    if (lead.id || lead.lead_id) {
      await supabase
        .from("commercial_actions")
        .insert([
          {
            lead_id: lead.id || lead.lead_id,
            action_type: "generated_message",
            action_title: "Mensagem gerada pela IA",
            message:
              "Foram geradas mensagens comerciais automáticas."
          }
        ])
    }

    res.json(messages)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get("/recommendations", async (req, res) => {
  try {
    const { data: leads, error } =
      await supabase
        .from("leads")
        .select("*")

    if (error) {
      return res.status(400).json(error)
    }

    const recommendations =
      (leads || [])
        .map((lead) => {
          const score =
            lead.lead_score || 0

          const recommendation =
            getRecommendationAction(lead)

          return {
            lead_id: lead.id,
            company_name: lead.company_name,
            responsible: lead.responsible,
            phone: lead.whatsapp || lead.phone || "",
            city: lead.city || "",
            score,
            temperature:
              lead.lead_temperature || "Frio",
            status:
              lead.status || "Sem status",
            current_motorcycle:
              lead.current_motorcycle || "",
            purchase_timeline:
              lead.purchase_timeline || "Sem previsão",
            professional_use:
              lead.professional_use || false,
            priority:
              recommendation.priority,
            action:
              recommendation.action,
            reason:
              recommendation.reason
          }
        })
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority
          }

          return b.score - a.score
        })

    res.json(recommendations)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

function getRecoveryLead(
  lead,
  daysWithoutContact
) {
  const score =
    lead.lead_score || 0

  const status =
    lead.status || ""

  if (
    score >= 70 &&
    daysWithoutContact >= 7
  ) {
    return {
      recovery_score:
        Math.min(
          100,
          score + daysWithoutContact
        ),
      reason:
        "Lead quente abandonado",
      recommended_action:
        "Retomar imediatamente"
    }
  }

  if (
    status === "Negociando" &&
    daysWithoutContact >= 5
  ) {
    return {
      recovery_score:
        Math.min(
          100,
          score + 15
        ),
      reason:
        "Negociação parada",
      recommended_action:
        "Enviar proposta novamente"
    }
  }

  return null
}

router.get("/followup-alerts", async (req, res) => {
  try {
    const { data: leads, error: leadsError } =
      await supabase
        .from("leads")
        .select("*")

    if (leadsError) {
      return res.status(400).json(leadsError)
    }

    const alerts = []

    for (const lead of leads || []) {
      const { data: actions, error: actionsError } =
        await supabase
          .from("commercial_actions")
          .select("*")
          .eq("lead_id", lead.id)
          .order("created_at", {
            ascending: false
          })
          .limit(1)

      if (actionsError) {
        return res.status(400).json(actionsError)
      }

      const lastAction =
        actions?.[0] || null

      const daysWithoutContact =
        daysBetween(lastAction?.created_at)

      const followup =
        getFollowupLevel(
          daysWithoutContact,
          lead
        )

      alerts.push({
        lead_id: lead.id,
        company_name: lead.company_name,
        responsible: lead.responsible,
        phone: lead.whatsapp || lead.phone || "",
        city: lead.city || "",
        score: lead.lead_score || 0,
        temperature:
          lead.lead_temperature || "Frio",
        status:
          lead.status || "Sem status",
        current_motorcycle:
          lead.current_motorcycle || "",
        purchase_timeline:
          lead.purchase_timeline || "Sem previsão",
        professional_use:
          lead.professional_use || false,
        last_action:
          lastAction
            ? {
                title: lastAction.action_title,
                type: lastAction.action_type,
                created_at: lastAction.created_at
              }
            : null,
        days_without_contact:
          daysWithoutContact,
        level:
          followup.level,
        priority:
          followup.priority,
        recommendation:
          followup.recommendation,
        reason:
          followup.reason
      })
    }

    res.json(
      alerts.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }

        return b.score - a.score
      })
    )

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.post("/actions", async (req, res) => {
  try {
    const {
      lead_id,
      action_type,
      action_title,
      message
    } = req.body

    if (!lead_id) {
      return res.status(400).json({
        error: "lead_id é obrigatório"
      })
    }

    const { data, error } =
      await supabase
        .from("commercial_actions")
        .insert([
          {
            lead_id,
            action_type,
            action_title,
            message
          }
        ])
        .select()

    if (error) {
      return res.status(400).json(error)
    }

    res.status(201).json(data)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get("/actions/:lead_id", async (req, res) => {
  try {
    const { lead_id } =
      req.params

    const { data, error } =
      await supabase
        .from("commercial_actions")
        .select("*")
        .eq("lead_id", lead_id)
        .order("created_at", {
          ascending: false
        })

    if (error) {
      return res.status(400).json(error)
    }

    res.json(data)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get(
  "/recovery-leads",
  async (req, res) => {

    try {

      const {
        data: leads,
        error: leadsError
      } =
        await supabase
          .from("leads")
          .select("*")

      if (leadsError) {
        return res
          .status(400)
          .json(leadsError)
      }

      const recoveryLeads = []

      for (const lead of leads || []) {

        const {
          data: actions
        } =
          await supabase
            .from(
              "commercial_actions"
            )
            .select("*")
            .eq(
              "lead_id",
              lead.id
            )
            .order(
              "created_at",
              {
                ascending: false
              }
            )
            .limit(1)

        const lastAction =
          actions?.[0]

        const daysWithoutContact =
          daysBetween(
            lastAction?.created_at
          )

        const recovery =
          getRecoveryLead(
            lead,
            daysWithoutContact
          )

        if (!recovery) continue

        recoveryLeads.push({
          lead_id:
            lead.id,
          company_name:
            lead.company_name,
          responsible:
            lead.responsible,
          phone:
            lead.whatsapp ||
            lead.phone ||
            "",
          city:
            lead.city || "",
          score:
            lead.lead_score || 0,
          temperature:
            lead.lead_temperature ||
            "Frio",
          status:
            lead.status ||
            "Sem status",
          days_without_contact:
            daysWithoutContact,
          recovery_score:
            recovery.recovery_score,
          reason:
            recovery.reason,
          recommended_action:
            recovery.recommended_action
        })

      }

      res.json(
        recoveryLeads.sort(
          (a, b) =>
            b.recovery_score -
            a.recovery_score
        )
      )

    } catch (err) {

      res.status(500).json({
        error: err.message
      })

    }

  }
)

module.exports = router