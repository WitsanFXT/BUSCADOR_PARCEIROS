const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

function getProbability(stage) {

  const probabilities = {
    "Lead Encontrado": 10,
    "Primeiro Contato": 25,
    "Interessado": 40,
    "Simulação Enviada": 60,
    "Documentação": 75,
    "Análise de Crédito": 90,
    "Venda Realizada": 100,
    "Perdido": 0
  }

  return probabilities[stage] ?? 10

}

router.get("/", async (req, res) => {

  try {

    const { data, error } =
      await supabase
        .from("sales_funnel")
        .select("*")
        .order("updated_at", {
          ascending: false
        })

    if (error) return res.status(400).json(error)

    res.json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

router.post("/", async (req, res) => {

  try {

    const stage =
      req.body.current_stage ||
      "Lead Encontrado"

    const probability =
      getProbability(stage)

    const { data, error } =
      await supabase
        .from("sales_funnel")
        .insert([
          {
            ...req.body,
            current_stage: stage,
            probability
          }
        ])
        .select()

    if (error) return res.status(400).json(error)

    await supabase
      .from("notifications")
      .insert([
        {
          title: "Novo lead no funil",
          message: `${req.body.customer_name} entrou no funil de vendas`,
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

router.put("/:id/stage", async (req, res) => {

  try {

    const { id } =
      req.params

    const { stage } =
      req.body

    const probability =
      getProbability(stage)

    const { data, error } =
      await supabase
        .from("sales_funnel")
        .update({
          current_stage: stage,
          probability,
          updated_at: new Date()
        })
        .eq("id", id)
        .select()

    if (error) return res.status(400).json(error)

    res.json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

router.put("/:id", async (req, res) => {

  try {

    const { id } =
      req.params

    const stage =
      req.body.current_stage

    const payload = {
      ...req.body,
      updated_at: new Date()
    }

    if (stage) {
      payload.probability =
        getProbability(stage)
    }

    const { data, error } =
      await supabase
        .from("sales_funnel")
        .update(payload)
        .eq("id", id)
        .select()

    if (error) return res.status(400).json(error)

    res.json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

router.delete("/:id", async (req, res) => {

  try {

    const { id } =
      req.params

    const { error } =
      await supabase
        .from("sales_funnel")
        .delete()
        .eq("id", id)

    if (error) return res.status(400).json(error)

    res.json({
      success: true
    })

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

router.post("/from-lead/:lead_id", async (req, res) => {

  try {

    const { lead_id } =
      req.params

    const { data: lead, error: findError } =
      await supabase
        .from("leads")
        .select("*")
        .eq("id", lead_id)
        .single()

    if (findError) return res.status(400).json(findError)

    const { data: existing } =
      await supabase
        .from("sales_funnel")
        .select("*")
        .eq("lead_id", lead_id)
        .limit(1)

    if (existing && existing.length > 0) {
      return res.status(409).json({
        error: "LEAD_ALREADY_IN_FUNNEL",
        message: "Este lead já está no funil",
        item: existing[0]
      })
    }

    const { data, error } =
      await supabase
        .from("sales_funnel")
        .insert([
          {
            lead_id: lead.id,
            customer_name: lead.company_name,
            phone: lead.whatsapp || lead.phone || "",
            city: lead.city || "",
            motorcycle_interest: lead.interest || "",
            current_stage: "Lead Encontrado",
            probability: 10,
            notes: lead.notes || ""
          }
        ])
        .select()

    if (error) return res.status(400).json(error)

    res.status(201).json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

module.exports = router