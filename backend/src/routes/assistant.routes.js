const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

const {
  generateAIResponse
} = require("../services/aiEngine.service")

function todayDate() {
  return new Date()
    .toISOString()
    .split("T")[0]
}

function daysBetween(date) {
  if (!date) return 999

  const lastDate = new Date(date)
  const now = new Date()

  return Math.floor(
    (now - lastDate) /
    (1000 * 60 * 60 * 24)
  )
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

function getLeadPriority(lead) {
  const score = lead.lead_score || 0

  if (score >= 80) return 1
  if (score >= 70) return 2
  if (score >= 40) return 3
  return 4
}

function getUrgencyLevel({
  criticalLeads,
  overdueFollowups,
  recoveryLeads
}) {
  if (
    criticalLeads.length ||
    recoveryLeads.length
  ) {
    return {
      level: "CRITICO",
      label: "Atenção máxima",
      message:
        "Existem leads quentes parados ou oportunidades com risco de esfriar."
    }
  }

  if (overdueFollowups.length) {
    return {
      level: "ATENCAO",
      label: "Atenção",
      message:
        "Existem follow-ups pendentes que precisam ser tratados hoje."
    }
  }

  return {
    level: "NORMAL",
    label: "Operação em dia",
    message:
      "A operação comercial está sob controle, mas ainda há espaço para gerar novas conversas."
  }
}

function buildExecutiveSummary({
  hotLeads,
  overdueFollowups,
  recoveryLeads,
  actionsToday,
  bestCity
}) {
  if (recoveryLeads.length) {
    return `Hoje eu começaria recuperando ${recoveryLeads[0].company_name}. É um lead quente parado e pode estar esfriando.`
  }

  if (overdueFollowups.length) {
    return `Hoje sua prioridade é resolver ${overdueFollowups.length} follow-up(s) pendente(s).`
  }

  if (hotLeads.length) {
    return `Você tem ${hotLeads.length} lead(s) quente(s). Eu focaria nos maiores scores primeiro.`
  }

  if (actionsToday.length === 0) {
    return "Ainda não há ações comerciais registradas hoje. Eu começaria criando novas conversas agora."
  }

  if (bestCity) {
    return `A cidade com melhor potencial hoje é ${bestCity.city}. Eu concentraria prospecção nela.`
  }

  return "Hoje eu focaria em gerar novas conversas e alimentar o CRM com oportunidades reais."
}

function getBestCity(leads) {
  const cityMap = {}

  ;(leads || []).forEach((lead) => {
    const city =
      lead.city || "Sem cidade"

    if (!cityMap[city]) {
      cityMap[city] = {
        city,
        total: 0,
        hot: 0,
        score_sum: 0
      }
    }

    cityMap[city].total += 1
    cityMap[city].score_sum += lead.lead_score || 0

    if (
      lead.lead_temperature === "Quente" ||
      (lead.lead_score || 0) >= 70
    ) {
      cityMap[city].hot += 1
    }
  })

  return Object.values(cityMap)
    .map(item => {
  const averageScore =
    Math.round(
      item.score_sum / item.total
    )

  return {
    ...item,
    average_score:
      averageScore,
    city_score:
      Math.min(
        100,
        Math.round(
          averageScore +
          item.hot * 5 +
          item.total * 2
        )
      )
  }
})
    .sort((a, b) =>
      b.city_score - a.city_score
    )[0]
}

async function getLastAction(leadId) {
  const { data } =
    await supabase
      .from("commercial_actions")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", {
        ascending: false
      })
      .limit(1)

  return data?.[0] || null
}

router.get("/home", async (req, res) => {
  try {
    const today = todayDate()

    const { data: leads, error: leadsError } =
      await supabase
        .from("leads")
        .select("*")

    if (leadsError) {
      return res.status(400).json(leadsError)
    }

    const { data: opportunities } =
      await supabase
        .from("opportunities")
        .select("*")

    const { data: followups } =
      await supabase
        .from("followups")
        .select("*")
        .eq("status", "Pendente")
        .lte("next_contact_date", today)

    const { data: actionsToday } =
      await supabase
        .from("commercial_actions")
        .select("*")
        .gte("created_at", `${today}T00:00:00`)

    const allLeads =
      leads || []

    const hotLeads =
      allLeads.filter(
        lead =>
          lead.lead_temperature === "Quente" ||
          (lead.lead_score || 0) >= 70
      )

    const coldLeads =
      allLeads.filter(
        lead =>
          lead.lead_temperature === "Frio" ||
          (lead.lead_score || 0) < 40
      )

    const negotiating =
      allLeads.filter(
        lead =>
          lead.status === "Negociando"
      )

    const overdueFollowups =
      followups || []

    const enrichedLeads = []

    for (const lead of allLeads) {
      const lastAction =
        await getLastAction(lead.id)

      const daysWithoutContact =
        daysBetween(lastAction?.created_at)

      enrichedLeads.push({
        ...lead,
        last_action: lastAction,
        days_without_contact:
          daysWithoutContact
      })
    }

    const criticalLeads =
      enrichedLeads.filter(
        lead =>
          (lead.lead_score || 0) >= 70 &&
          lead.days_without_contact >= 7
      )

    const recoveryLeads =
      enrichedLeads
        .filter(
          lead =>
            (
              (lead.lead_score || 0) >= 70 &&
              lead.days_without_contact >= 7
            ) ||
            (
              lead.status === "Negociando" &&
              lead.days_without_contact >= 5
            )
        )
        .map(lead => ({
          lead_id: lead.id,
          company_name: lead.company_name,
          responsible: lead.responsible,
          phone: lead.whatsapp || lead.phone || "",
          city: lead.city || "",
          score: lead.lead_score || 0,
          temperature:
            lead.lead_temperature || "Frio",
          days_without_contact:
            lead.days_without_contact,
          reason:
            "Lead quente ou negociação parada sem ação recente.",
          recommended_action:
            "Retomar contato agora"
        }))
        .sort((a, b) =>
          b.score - a.score
        )

    const bestCity =
      getBestCity(allLeads)

    const urgency =
      getUrgencyLevel({
        criticalLeads,
        overdueFollowups,
        recoveryLeads
      })

    const executiveSummary =
      buildExecutiveSummary({
        hotLeads,
        overdueFollowups,
        recoveryLeads,
        actionsToday: actionsToday || [],
        bestCity
      })

    const priorities = []

    recoveryLeads
      .slice(0, 3)
      .forEach((lead, index) => {
        priorities.push({
          type: "recovery",
          priority: index + 1,
          lead_id: lead.lead_id,
          title:
            `Recuperar ${lead.company_name}`,
          description:
            `Lead ${lead.temperature}, score ${lead.score}, há ${lead.days_without_contact} dias sem contato.`,
          action:
            "Enviar mensagem de recuperação",
          route:
            "/recuperacao-leads"
        })
      })

    overdueFollowups
      .slice(0, 3)
      .forEach((followup, index) => {
        priorities.push({
          type: "followup",
          priority:
            priorities.length + index + 1,
          lead_id:
            followup.lead_id,
          title:
            followup.title ||
            followup.contact_name ||
            "Follow-up pendente",
          description:
            "Existe um follow-up vencido ou agendado para hoje.",
          action:
            "Resolver follow-up",
          route:
            "/followup-ia"
        })
      })

    hotLeads
      .sort((a, b) =>
        (b.lead_score || 0) -
        (a.lead_score || 0)
      )
      .slice(0, 3)
      .forEach((lead) => {
        priorities.push({
          type: "hot_lead",
          priority:
            priorities.length + 1,
          lead_id:
            lead.id,
          title:
            `Atacar ${lead.company_name}`,
          description:
            `Lead quente com score ${lead.lead_score || 0}.`,
          action:
            "Gerar mensagem IA",
          route:
            "/ia-prioridades"
        })
      })

    const dailyPlan = [
      {
        type: "priority",
        title:
          "Executar prioridades da IA",
        description:
          "Comece pelos leads com maior risco ou maior potencial de fechamento.",
        priority: 1
      },
      {
        type: "followup",
        title:
          "Resolver follow-ups",
        description:
          `Você possui ${overdueFollowups.length} follow-up(s) pendente(s).`,
        priority: 2
      },
      {
        type: "prospecting",
        title:
          "Criar 10 novas conversas",
        description:
          "Use Radar, indicações, marketplace e empresas locais.",
        priority: 3
      },
      {
        type: "content",
        title:
          "Publicar um conteúdo comercial",
        description:
          "Publique uma entrega, simulação ou oportunidade do dia.",
        priority: 4
      }
    ]

    const insights = []

    if (hotLeads.length) {
      insights.push({
        type: "opportunity",
        title:
          "Você tem leads prontos para ação",
        description:
          `${hotLeads.length} lead(s) estão quentes. Não deixe esfriar.`
      })
    }

    if (recoveryLeads.length) {
      insights.push({
        type: "risk",
        title:
          "Leads quentes estão parados",
        description:
          `${recoveryLeads.length} lead(s) precisam de recuperação imediata.`
      })
    }

    if (bestCity) {
      insights.push({
        type: "city",
        title:
          `Concentre energia em ${bestCity.city}`,
        description:
          `Essa cidade tem score comercial ${bestCity.city_score}, com ${bestCity.total} lead(s) e ${bestCity.hot} quente(s).`
      })
    }

    if ((actionsToday || []).length === 0) {
      insights.push({
        type: "activity",
        title:
          "Nenhuma ação registrada hoje",
        description:
          "Abra WhatsApp, gere mensagens ou registre follow-ups para alimentar a inteligência comercial."
      })
    }

    res.json({
      assistant_name:
        "MotoLead AI",
      greeting:
        getGreeting(),
      executive_summary:
        executiveSummary,
      urgency,
      metrics: {
        leads:
          allLeads.length,
        hot_leads:
          hotLeads.length,
        cold_leads:
          coldLeads.length,
        negotiating:
          negotiating.length,
        opportunities:
          opportunities?.length || 0,
        overdue_followups:
          overdueFollowups.length,
        actions_today:
          actionsToday?.length || 0,
        recovery_leads:
          recoveryLeads.length
      },
      main_recommendation:
        priorities[0] || {
          title:
            "Gerar novas conversas",
          description:
            "Não há urgência crítica agora. Foque em prospecção ativa.",
          action:
            "Prospectar novos leads",
          route:
            "/radar"
        },
      priorities:
        priorities.slice(0, 8),
      daily_plan:
        dailyPlan,
      insights
    })

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get("/summary", async (req, res) => {
  try {
    const today = todayDate()

    const { data: leads, error: leadsError } =
      await supabase
        .from("leads")
        .select("*")

    if (leadsError) {
      return res.status(400).json(leadsError)
    }

    const { data: opportunities } =
      await supabase
        .from("opportunities")
        .select("*")

    const { data: followups } =
      await supabase
        .from("followups")
        .select("*")
        .eq("status", "Pendente")
        .lte("next_contact_date", today)

    const { data: actions } =
      await supabase
        .from("commercial_actions")
        .select("*")
        .gte("created_at", `${today}T00:00:00`)

    const hotLeads =
      (leads || []).filter(
        lead =>
          lead.lead_temperature === "Quente" ||
          (lead.lead_score || 0) >= 70
      )

    const negotiating =
      (leads || []).filter(
        lead =>
          lead.status === "Negociando"
      )

    const coldLeads =
      (leads || []).filter(
        lead =>
          lead.lead_temperature === "Frio" ||
          (lead.lead_score || 0) < 40
      )

    res.json({
      greeting: getGreeting(),
      message:
        "Aqui está seu resumo comercial de hoje.",
      totals: {
        leads: leads?.length || 0,
        hot_leads: hotLeads.length,
        cold_leads: coldLeads.length,
        negotiating: negotiating.length,
        opportunities: opportunities?.length || 0,
        pending_followups: followups?.length || 0,
        actions_today: actions?.length || 0
      }
    })

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get("/daily-plan", async (req, res) => {
  try {
    const today = todayDate()

    const { data: leads, error: leadsError } =
      await supabase
        .from("leads")
        .select("*")

    if (leadsError) {
      return res.status(400).json(leadsError)
    }

    const { data: followups } =
      await supabase
        .from("followups")
        .select("*")
        .eq("status", "Pendente")
        .lte("next_contact_date", today)

    const priorityLeads =
      (leads || [])
        .filter(
          lead =>
            (lead.lead_score || 0) >= 70
        )
        .sort(
          (a, b) =>
            getLeadPriority(a) -
            getLeadPriority(b)
        )
        .slice(0, 5)

    const tasks = []

    if (followups?.length) {
      tasks.push({
        type: "followup",
        title: "Resolver follow-ups pendentes",
        description:
          `Você possui ${followups.length} follow-up(s) vencido(s) ou para hoje.`,
        priority: 1
      })
    }

    priorityLeads.forEach((lead, index) => {
      tasks.push({
        type: "lead",
        lead_id: lead.id,
        title:
          `Atacar ${lead.company_name}`,
        description:
          `Lead ${lead.lead_temperature || "Quente"} com score ${lead.lead_score || 0}.`,
        priority:
          index + 2
      })
    })

    tasks.push({
      type: "prospecting",
      title: "Gerar novas conversas",
      description:
        "Meta recomendada: iniciar pelo menos 10 novas conversas hoje.",
      priority: 8
    })

    tasks.push({
      type: "content",
      title: "Publicar conteúdo comercial",
      description:
        "Poste um status ou vídeo curto mostrando oportunidade, entrega ou simulação.",
      priority: 9
    })

    res.json(
      tasks.sort(
        (a, b) =>
          a.priority - b.priority
      )
    )

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get("/insights", async (req, res) => {
  try {
    const { data: leads, error: leadsError } =
      await supabase
        .from("leads")
        .select("*")

    if (leadsError) {
      return res.status(400).json(leadsError)
    }

    const { data: actions } =
      await supabase
        .from("commercial_actions")
        .select("*")
        .order("created_at", {
          ascending: false
        })

    const insights = []

    const hotLeads =
      (leads || []).filter(
        lead =>
          (lead.lead_score || 0) >= 70
      )

    const noPhone =
      (leads || []).filter(
        lead =>
          !lead.phone &&
          !lead.whatsapp
      )

    if (hotLeads.length) {
      insights.push({
        type: "opportunity",
        title: "Há leads quentes no CRM",
        description:
          `Você tem ${hotLeads.length} lead(s) com alto potencial. Priorize contato rápido.`
      })
    }

    if (noPhone.length) {
      insights.push({
        type: "data_quality",
        title: "Leads sem telefone",
        description:
          `${noPhone.length} lead(s) estão sem telefone ou WhatsApp. Corrija para evitar perda de oportunidade.`
      })
    }

    if (!actions?.length) {
      insights.push({
        type: "activity",
        title: "Pouca atividade registrada",
        description:
          "Ainda não há histórico comercial suficiente. Use WhatsApp, mensagens IA e follow-ups para alimentar a inteligência."
      })
    }

    const bestCity =
      getBestCity(leads || [])

    if (bestCity) {
      insights.push({
        type: "city",
        title:
          `Cidade com maior potencial: ${bestCity.city}`,
        description:
          `Score médio ${bestCity.average_score} com ${bestCity.total} lead(s).`
      })
    }

    res.json(insights)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.post("/generate", async (req, res) => {
  try {
    const {
      objective,
      lead_id,
      extra
    } = req.body

    if (!objective) {
      return res.status(400).json({
        error: "objective é obrigatório"
      })
    }

    let lead = null
    let actions = []

    if (lead_id) {
      const { data: leadData, error: leadError } =
        await supabase
          .from("leads")
          .select("*")
          .eq("id", lead_id)
          .single()

      if (leadError) {
        return res.status(400).json(leadError)
      }

      lead = leadData

      const { data: actionsData } =
        await supabase
          .from("commercial_actions")
          .select("*")
          .eq("lead_id", lead_id)
          .order("created_at", {
            ascending: false
          })
          .limit(10)

      actions = actionsData || []
    }

    const result =
      await generateAIResponse({
        objective,
        lead,
        actions,
        extra: extra || {}
      })

    if (lead_id) {
      await supabase
        .from("commercial_actions")
        .insert([
          {
            lead_id,
            action_type:
              `ai_generated_${objective}`,
            action_title:
              result.title || "Conteúdo gerado pela IA",
            message:
              result.message ||
              result.caption ||
              result.advice ||
              JSON.stringify(result)
          }
        ])
    }

    res.json(result)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

module.exports = router