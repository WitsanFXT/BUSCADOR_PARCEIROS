const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

function todayDate() {
  return new Date()
    .toISOString()
    .split("T")[0]
}

function leadScore(lead) {

  let score = 0

  if (lead.priority === "Alta") score += 70
  if (lead.priority === "Média") score += 50
  if (lead.priority === "Baixa") score += 30

  if (lead.status === "Novo Lead") score += 15
  if (lead.status === "Negociando") score += 25
  if (lead.status === "Parceiro") score -= 30

  if (lead.phone || lead.whatsapp) score += 15
  if (lead.instagram) score += 10
  if (lead.city) score += 5

  return Math.max(
    0,
    Math.min(score, 100)
  )

}

function priorityLabel(score) {

  if (score >= 80) return "Prioridade Máxima"
  if (score >= 70) return "Alta Prioridade"
  if (score >= 40) return "Prioridade Média"
  return "Baixa Prioridade"

}

router.get("/priorities", async (req, res) => {

  try {

    const today =
      todayDate()

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
          leadScore(lead)

        return {
          type: "lead",
          id: lead.id,
          title: lead.company_name,
          phone: lead.whatsapp || lead.phone || "",
          city: lead.city || "",
          status: lead.status || "Sem status",
          score,
          probability:
            score >= 80
              ? 85
              : score >= 70
                ? 75
                : score >= 40
                  ? 50
                  : 25,
          reason:
            "Lead do CRM com prioridade calculada pelo status, telefone, cidade e prioridade.",
          label:
            priorityLabel(score)
        }

      })

    const opportunityItems =
      (opportunities || [])
        .filter(item =>
          item.status !== "Enviado para CRM"
        )
        .map(item => {

          const score =
            item.score || 0

          return {
            type: "opportunity",
            id: item.id,
            title: item.name,
            phone: item.phone || "",
            city: item.city || "",
            status: item.status || "Nova oportunidade",
            score,
            probability:
              item.trade_probability || score,
            reason:
              `Oportunidade do Radar: ${item.category || "sem categoria"}. ${item.current_motorcycle ? `Moto atual: ${item.current_motorcycle}.` : ""}`,
            label:
              priorityLabel(score)
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
        phone:
          item.phone || "",
        city: "",
        status: "Follow-up vencido/para hoje",
        score: 100,
        probability: 90,
        reason:
          item.notes ||
          "Este contato possui retorno pendente para hoje ou atrasado.",
        label:
          "Follow-up Urgente"
      }))

    const priorities =
      [
        ...followupItems,
        ...opportunityItems,
        ...leadItems
      ]
        .sort((a, b) =>
          b.score - a.score
        )
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

    const { id } =
      req.params

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

    const { id } =
      req.params

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