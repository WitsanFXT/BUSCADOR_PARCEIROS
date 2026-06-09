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

router.post("/chat", async (req, res) => {
  try {
    const {
      message
    } = req.body

    if (!message) {
      return res.status(400).json({
        error: "message é obrigatório"
      })
    }

    const today =
      todayDate()

    const { data: leads } =
      await supabase
        .from("leads")
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

    const hotLeads =
      (leads || []).filter(
        lead =>
          lead.lead_temperature === "Quente" ||
          (lead.lead_score || 0) >= 70
      )

    const topLeads =
      hotLeads
        .sort(
          (a, b) =>
            (b.lead_score || 0) -
            (a.lead_score || 0)
        )
        .slice(0, 5)
        .map(
          lead =>
            `${lead.company_name} | Score ${lead.lead_score || 0} | ${lead.lead_temperature || "Sem temperatura"}`
        )
        .join("\n")

    const systemContext =
      `
Resumo atual:
- Leads totais: ${(leads || []).length}
- Leads quentes: ${hotLeads.length}
- Follow-ups pendentes: ${(followups || []).length}
- Ações registradas hoje: ${(actionsToday || []).length}

Top leads:
${topLeads || "Nenhum lead quente encontrado."}
`

    const result =
      await generateAIResponse({
        objective: "chat",
        lead: null,
        actions: [],
        extra: {
          message,
          system_context: systemContext
        }
      })

    res.json(result)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.post("/predict", async (req, res) => {
  try {
    const {
      lead_id,
      lead,
      context
    } = req.body

    let leadData =
      lead || null

    let actions = []

    if (lead_id) {
      const { data, error } =
        await supabase
          .from("leads")
          .select("*")
          .eq("id", lead_id)
          .single()

      if (error) {
        return res.status(400).json(error)
      }

      leadData = data

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
        objective: "prediction",
        lead: leadData,
        actions,
        extra: {
          context: context || ""
        }
      })

    res.json(result)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get("/coach", async (req, res) => {
  try {
    const today =
      todayDate()

    const { data: leads } =
      await supabase
        .from("leads")
        .select("*")

    const { data: funnel } =
      await supabase
        .from("sales_funnel")
        .select("*")

    const { data: actionsToday } =
      await supabase
        .from("commercial_actions")
        .select("*")
        .gte("created_at", `${today}T00:00:00`)

    const { data: followups } =
      await supabase
        .from("followups")
        .select("*")
        .eq("status", "Pendente")
        .lte("next_contact_date", today)

    const { data: opportunities } =
      await supabase
        .from("opportunities")
        .select("*")

    const hotLeads =
      (leads || []).filter(
        lead =>
          lead.lead_temperature === "Quente" ||
          (lead.lead_score || 0) >= 70
      )

    const funnelItems =
      funnel || []

    const simulations =
      funnelItems.filter(
        item =>
          item.current_stage === "Simulação Enviada"
      )

    const interested =
      funnelItems.filter(
        item =>
          item.current_stage === "Interessado"
      )

    const lost =
      funnelItems.filter(
        item =>
          item.current_stage === "Perdido"
      )

    const sales =
      funnelItems.filter(
        item =>
          item.current_stage === "Venda Realizada"
      )

    let score = 70

    if (hotLeads.length >= 3) score += 10
    if ((actionsToday || []).length >= 10) score += 10
    if ((followups || []).length > 0) score -= 10
    if (lost.length > sales.length && lost.length > 0) score -= 10
    if ((opportunities || []).length >= 5) score += 5

    score =
      Math.max(
        0,
        Math.min(score, 100)
      )

    const strengths = []
    const problems = []
    const next2Hours = []
    const dailyTargets = []

    if (hotLeads.length) {
      strengths.push(
        `Você tem ${hotLeads.length} lead(s) quente(s) para trabalhar.`
      )
    }

    if ((opportunities || []).length) {
      strengths.push(
        `Existem ${opportunities.length} oportunidade(s) no Radar para explorar.`
      )
    }

    if ((actionsToday || []).length >= 5) {
      strengths.push(
        `Você já registrou ${actionsToday.length} ação(ões) comerciais hoje.`
      )
    }

    if ((followups || []).length) {
      problems.push(
        `Você possui ${followups.length} follow-up(s) vencido(s) ou para hoje.`
      )

      next2Hours.push(
        "Resolver todos os follow-ups pendentes antes de prospectar novos leads."
      )
    }

    if (interested.length) {
      problems.push(
        `${interested.length} cliente(s) estão interessados e precisam ser conduzidos para simulação.`
      )

      next2Hours.push(
        "Enviar simulação para clientes na etapa Interessado."
      )
    }

    if (simulations.length) {
      problems.push(
        `${simulations.length} simulação(ões) foram enviadas e precisam de retorno.`
      )

      next2Hours.push(
        "Fazer follow-up das simulações enviadas."
      )
    }

    if (lost.length > sales.length && lost.length > 0) {
      problems.push(
        "Há mais clientes perdidos do que vendas realizadas no funil."
      )
    }

    next2Hours.push(
      "Falar com os 3 leads de maior score."
    )

    next2Hours.push(
      "Gerar pelo menos 5 novas conversas no Radar."
    )

    dailyTargets.push(
      "10 novas conversas comerciais."
    )

    dailyTargets.push(
      "5 follow-ups concluídos."
    )

    dailyTargets.push(
      "3 simulações enviadas."
    )

    dailyTargets.push(
      "1 conteúdo publicado no WhatsApp Status."
    )

    const diagnosis =
      score >= 85
        ? "Sua operação está forte hoje. O foco deve ser acelerar fechamento."
        : score >= 70
          ? "Sua operação está boa, mas existem pontos que precisam de ação rápida."
          : score >= 50
            ? "Sua operação está em atenção. Existem gargalos que podem comprometer vendas."
            : "Sua operação está crítica. É necessário retomar follow-ups e gerar novas conversas imediatamente."

    const managerAdvice =
      (followups || []).length
        ? "Antes de buscar novos leads, resolva os follow-ups pendentes. Lead sem retorno perde temperatura rapidamente."
        : hotLeads.length
          ? "Você já tem oportunidades boas. Ataque primeiro os leads quentes e só depois foque em prospecção."
          : "Hoje o foco deve ser gerar demanda: Radar, indicações, marketplace e conteúdo."

    res.json({
      title:
        "AutoCoach Comercial",
      score,
      diagnosis,
      strengths,
      problems,
      next_2_hours:
        next2Hours,
      daily_targets:
        dailyTargets,
      manager_advice:
        managerAdvice
    })

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.post("/extract-leads", async (req, res) => {
  try {
    const { text, source, city } = req.body

    if (!text) {
      return res.status(400).json({
        error: "text é obrigatório"
      })
    }

    const result =
      await generateAIResponse({
        objective: "extract_leads",
        lead: null,
        actions: [],
        extra: {
          text,
          source,
          city
        }
      })

    const leadsToInsert =
      (result.leads || []).map((lead) => ({
        source: source || lead.lead_source || "Manual",
        source_text: text,
        original_comment:
          lead.original_comment || "",
        name:
          lead.name || "",
        phone:
          lead.phone || "",
        instagram:
          lead.instagram || "",
        city:
          lead.city || city || "",
        interest:
          lead.interest || "",
        current_motorcycle:
          lead.current_motorcycle || "",
        professional_use:
          lead.professional_use || false,
        lead_score:
          lead.lead_score || 0,
        reason:
          lead.reason || "",
        review_status:
          "pending"
      }))

    if (!leadsToInsert.length) {
      return res.json({
        title: "Nenhum lead encontrado",
        leads: []
      })
    }

    const { data, error } =
      await supabase
        .from("extracted_leads")
        .insert(leadsToInsert)
        .select()

    if (error) {
      console.log("Erro ao salvar extracted_leads:", error)

      return res.status(400).json(error)
    }

    res.status(201).json({
      title: result.title || "Leads extraídos",
      summary: result.summary || "",
      leads: data
    })

  } catch (err) {
    console.log("Erro em /assistant/extract-leads:", err)

    res.status(500).json({
      error: err.message
    })
  }
})

router.get("/extracted-leads", async (req, res) => {
  try {
    const status =
      req.query.status || "pending"

    const { data, error } =
      await supabase
        .from("extracted_leads")
        .select("*")
        .eq("review_status", status)
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

router.put("/extracted-leads/:id/status", async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowed = [
      "pending",
      "approved",
      "rejected",
      "later",
      "sent_crm",
      "sent_radar"
    ]

    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: "status inválido"
      })
    }

    const { data, error } =
      await supabase
        .from("extracted_leads")
        .update({
          review_status: status
        })
        .eq("id", id)
        .select()

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

router.post("/extracted-leads/:id/send-crm", async (req, res) => {
  try {
    const { id } = req.params

    const { data: extracted, error: findError } =
      await supabase
        .from("extracted_leads")
        .select("*")
        .eq("id", id)
        .single()

    if (findError) {
      return res.status(400).json(findError)
    }

    const { data: lead, error: leadError } =
      await supabase
        .from("leads")
        .insert([
          {
            company_name:
              extracted.name || "Lead extraído",
            responsible:
              extracted.name || "",
            phone:
              extracted.phone || "",
            whatsapp:
              extracted.phone || "",
            instagram:
              extracted.instagram || "",
            city:
              extracted.city || "",
            interest:
              extracted.interest || "",
            current_motorcycle:
              extracted.current_motorcycle || "",
            professional_use:
              extracted.professional_use || false,
            lead_source:
              extracted.source || "Captação IA",
            lead_score:
              extracted.lead_score || 0,
            lead_temperature:
              extracted.lead_score >= 70
                ? "Quente"
                : extracted.lead_score >= 40
                  ? "Morno"
                  : "Frio",
            notes:
              extracted.reason || "",
            status:
              "Novo Lead",
            priority:
              extracted.lead_score >= 70
                ? "Alta"
                : "Média"
          }
        ])
        .select()

    if (leadError) {
      return res.status(400).json(leadError)
    }

    await supabase
      .from("extracted_leads")
      .update({
        review_status: "sent_crm"
      })
      .eq("id", id)

    res.status(201).json(lead)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.post("/extracted-leads/:id/send-radar", async (req, res) => {
  try {
    const { id } = req.params

    const { data: extracted, error: extractedError } =
      await supabase
        .from("extracted_leads")
        .select("*")
        .eq("id", id)
        .single()

    if (extractedError || !extracted) {
      return res.status(404).json({
        error: "Lead extraído não encontrado"
      })
    }

    const opportunityData = {
      name:
        extracted.name ||
        "Lead captado pela IA",

      source:
        extracted.source ||
        "Captação IA",

      city:
        extracted.city || "",

      category:
        extracted.professional_use
          ? "Uso profissional"
          : "Lead captado",

      phone:
        extracted.phone || "",

      instagram:
        extracted.instagram || "",

      status:
        "Novo",

      notes:
        [
          extracted.interest
            ? `Interesse: ${extracted.interest}`
            : null,

          extracted.current_motorcycle
            ? `Moto atual: ${extracted.current_motorcycle}`
            : null,

          extracted.reason
            ? `Motivo IA: ${extracted.reason}`
            : null,

          extracted.source_text
            ? `Origem: ${extracted.source_text}`
            : null
        ]
          .filter(Boolean)
          .join("\n\n"),

      score:
        extracted.lead_score || 0,

      trade_probability:
        extracted.lead_score || 0,

      professional_use:
        extracted.professional_use || false,

      purchase_timeline:
        "Sem previsão",

      current_motorcycle:
        extracted.current_motorcycle || ""
    }

    const {
      data: opportunity,
      error: opportunityError
    } =
      await supabase
        .from("opportunities")
        .insert([opportunityData])
        .select()

    if (opportunityError) {
      return res.status(400).json({
        error:
          opportunityError.message
      })
    }

    const {
      error: updateError
    } =
      await supabase
        .from("extracted_leads")
        .update({
          review_status:
            "sent_radar"
        })
        .eq("id", id)

    if (updateError) {
      return res.status(400).json({
        error:
          updateError.message
      })
    }

    res.status(201).json({
      success: true,
      message:
        "Lead enviado para o Radar com sucesso.",
      opportunity:
        opportunity?.[0]
    })

  } catch (err) {
    console.log(
      "Erro send-radar:",
      err
    )

    res.status(500).json({
      error: err.message
    })
  }
})


module.exports = router