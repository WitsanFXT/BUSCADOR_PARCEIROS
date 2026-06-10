const express = require("express")

const router = express.Router()

const supabase = require("../config/supabase")

const {
  calculateLeadScore,
  getLeadTemperature
} = require("../utils/leadScore")

function todayDate() {
  return new Date()
    .toISOString()
    .split("T")[0]
}

function priorityLabel(score) {
  if (score >= 80) return "Prioridade Máxima"
  if (score >= 70) return "Alta Prioridade"
  if (score >= 40) return "Prioridade Média"
  return "Baixa Prioridade"
}

function probabilityByScore(score) {
  if (score >= 80) return 90
  if (score >= 70) return 80
  if (score >= 40) return 55
  return 25
}

router.get("/priorities", async (req, res) => {
  try {
    const today = todayDate()

    const { data: leads, error: leadsError } =
      await supabase
        .from("leads")
        .select("*")

    if (leadsError) {
      return res.status(400).json(leadsError)
    }

    const { data: opportunities, error: opportunitiesError } =
      await supabase
        .from("opportunities")
        .select("*")

    if (opportunitiesError) {
      return res.status(400).json(opportunitiesError)
    }

    const { data: followups, error: followupsError } =
      await supabase
        .from("followups")
        .select("*")
        .eq("status", "Pendente")
        .lte("next_contact_date", today)

    if (followupsError) {
      return res.status(400).json(followupsError)
    }

    const leadItems =
      (leads || []).map(lead => {
        const score =
          lead.lead_score ??
          calculateLeadScore(lead)

        const temperature =
          lead.lead_temperature ??
          getLeadTemperature(score)

        return {
          type: "lead",
          id: lead.id,
          title: lead.company_name,
          phone: lead.whatsapp || lead.phone || "",
          instagram: lead.instagram || "",
          city: lead.city || "",
          status: lead.status || "Sem status",
          score,
          temperature,
          probability: probabilityByScore(score),
          reason:
            `Lead ${temperature} do CRM. Score calculado com base em prioridade, status, origem, moto atual, ano, KM, uso profissional e prazo de compra.`,
          label: priorityLabel(score)
        }
      })

    const opportunityItems =
      (opportunities || [])
        .filter(item =>
          item.status !== "Enviado para CRM"
        )
        .map(item => {
          const score =
            item.score ??
            calculateLeadScore({
              priority: item.priority,
              status: item.status,
              phone: item.phone,
              whatsapp: item.whatsapp,
              instagram: item.instagram,
              city: item.city,
              current_motorcycle: item.current_motorcycle,
              motorcycle_year: item.motorcycle_year,
              mileage: item.mileage,
              professional_use: item.professional_use,
              lead_source: item.source,
              purchase_timeline: item.purchase_timeline
            })

          const temperature =
            getLeadTemperature(score)

          return {
            type: "opportunity",
            id: item.id,
            title: item.name,
            phone: item.phone || "",
            instagram: item.instagram || "",
            city: item.city || "",
            status: item.status || "Nova oportunidade",
            score,
            temperature,
            probability: item.trade_probability || probabilityByScore(score),
            reason:
              `Oportunidade ${temperature} do Radar. ${item.category ? `Categoria: ${item.category}.` : ""} ${item.current_motorcycle ? `Moto atual: ${item.current_motorcycle}.` : ""}`,
            label: priorityLabel(score)
          }
        })

    const followupItems =
      (followups || []).map(item => ({
        type: "followup",
        id: item.id,
        lead_id: item.lead_id,
        opportunity_id: item.opportunity_id,
        title:
          item.contact_name ||
          item.title ||
          "Follow-up pendente",
        phone: item.phone || "",
        city: "",
        status: "Follow-up vencido/para hoje",
        score: 100,
        temperature: "Quente",
        probability: 95,
        reason:
          item.notes ||
          "Este contato possui retorno pendente para hoje ou está atrasado.",
        label: "Follow-up Urgente"
      }))

    const priorities =
      [
        ...followupItems,
        ...opportunityItems,
        ...leadItems
      ]
        .sort((a, b) => b.score - a.score)
        .slice(0, 30)

    res.json(priorities)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.get("/followups", async (req, res) => {
  try {
    const { data, error } =
      await supabase
        .from("followups")
        .select("*")
        .order("next_contact_date", {
          ascending: true
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

router.post("/followups", async (req, res) => {
  try {
    const {
      lead_id,
      opportunity_id,
      title,
      contact_name,
      phone,
      source,
      next_contact_date,
      notes
    } = req.body

    if (!next_contact_date) {
      return res.status(400).json({
        error: "A data do próximo contato é obrigatória"
      })
    }

    const { data, error } =
      await supabase
        .from("followups")
        .insert([
          {
            lead_id,
            opportunity_id,
            title,
            contact_name,
            phone,
            source,
            next_contact_date,
            notes,
            status: "Pendente"
          }
        ])
        .select()

    if (error) {
      return res.status(400).json(error)
    }

    await supabase
      .from("notifications")
      .insert([
        {
          title: "Follow-up agendado",
          message:
            `${contact_name || title || "Contato"} deve ser contatado em ${next_contact_date}`,
          read: false
        }
      ])

    res.status(201).json(data)

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

router.put("/followups/:id/done", async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } =
      await supabase
        .from("followups")
        .update({
          status: "Concluído"
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

router.delete("/followups/:id", async (req, res) => {
  try {
    const { id } = req.params

    const { error } =
      await supabase
        .from("followups")
        .delete()
        .eq("id", id)

    if (error) {
      return res.status(400).json(error)
    }

    res.json({
      success: true
    })

  } catch (err) {
    res.status(500).json({
      error: err.message
    })
  }
})

module.exports = router