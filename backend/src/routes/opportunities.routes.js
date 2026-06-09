const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function calculateScore(opportunity) {

  let score = 0

  const category =
    normalize(opportunity.category)

  const source =
    normalize(opportunity.source)

  const currentMotorcycle =
    normalize(opportunity.current_motorcycle)

  const purchaseTimeline =
    normalize(opportunity.purchase_timeline)

  const year =
    Number(opportunity.motorcycle_year || 0)

  const mileage =
    Number(opportunity.mileage || 0)

  if (category.includes("motoboy")) score += 25
  if (category.includes("mototaxi")) score += 25
  if (category.includes("delivery")) score += 20
  if (category.includes("entregador")) score += 20
  if (category.includes("auto escola")) score += 20
  if (category.includes("oficina")) score += 15
  if (category.includes("moto pecas")) score += 15
  if (category.includes("borracharia")) score += 10
  if (category.includes("empresa")) score += 10
  if (category.includes("fazenda")) score += 10

  if (opportunity.phone) score += 15
  if (opportunity.instagram) score += 10

  if (source.includes("marketplace")) score += 15
  if (source.includes("facebook")) score += 10
  if (source.includes("indicacao")) score += 15
  if (source.includes("instagram")) score += 10

  if (opportunity.professional_use) score += 20

  if (currentMotorcycle) score += 10

  if (
    currentMotorcycle.includes("factor") ||
    currentMotorcycle.includes("fazer") ||
    currentMotorcycle.includes("crosser") ||
    currentMotorcycle.includes("cg") ||
    currentMotorcycle.includes("bros")
  ) {
    score += 15
  }

  const currentYear =
    new Date().getFullYear()

  const motorcycleAge =
    year > 0
      ? currentYear - year
      : 0

  if (motorcycleAge >= 8) score += 25
  else if (motorcycleAge >= 5) score += 20
  else if (motorcycleAge >= 3) score += 10

  if (mileage >= 80000) score += 25
  else if (mileage >= 50000) score += 20
  else if (mileage >= 30000) score += 10

  if (purchaseTimeline.includes("imediata")) score += 25
  if (purchaseTimeline.includes("30")) score += 20
  if (purchaseTimeline.includes("3 meses")) score += 15
  if (purchaseTimeline.includes("6 meses")) score += 5

  return Math.max(
    0,
    Math.min(score, 100)
  )

}

function calculateTradeProbability(score) {

  if (score >= 90) return 95
  if (score >= 80) return 85
  if (score >= 70) return 75
  if (score >= 60) return 60
  if (score >= 40) return 45

  return 20

}

function getTemperature(score) {

  if (score >= 70) return "Quente"
  if (score >= 40) return "Morno"

  return "Frio"

}

router.get("/", async (req, res) => {

  try {

    const { data, error } =
      await supabase
        .from("opportunities")
        .select("*")
        .order("score", {
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

router.post("/", async (req, res) => {

  try {

    const score =
      calculateScore(req.body)

    const trade_probability =
      calculateTradeProbability(score)

    const payload = {
      ...req.body,
      motorcycle_year:
        req.body.motorcycle_year
          ? Number(req.body.motorcycle_year)
          : null,
      mileage:
        req.body.mileage
          ? Number(req.body.mileage)
          : null,
      professional_use:
        req.body.professional_use || false,
      score,
      trade_probability
    }

    const { data, error } =
      await supabase
        .from("opportunities")
        .insert([
          payload
        ])
        .select()

    if (error) {
      console.log(error)
      return res.status(400).json(error)
    }

    await supabase
      .from("notifications")
      .insert([
        {
          title: "Nova oportunidade",
          message: `${req.body.name} entrou no Radar`,
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

router.put("/:id", async (req, res) => {

  try {

    const { id } =
      req.params

    const { data: currentOpportunity, error: findError } =
      await supabase
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .single()

    if (findError) {
      return res.status(400).json(findError)
    }

    const updatedPayload = {
      ...currentOpportunity,
      ...req.body
    }

    const score =
      calculateScore(updatedPayload)

    const trade_probability =
      calculateTradeProbability(score)

    const { data, error } =
      await supabase
        .from("opportunities")
        .update({
          ...req.body,
          score,
          trade_probability
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

router.delete("/:id", async (req, res) => {

  try {

    const { id } =
      req.params

    const { error } =
      await supabase
        .from("opportunities")
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

router.post("/:id/to-lead", async (req, res) => {

  try {

    const { id } =
      req.params

    const { data: opportunity, error: findError } =
      await supabase
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .single()

    if (findError) {
      return res.status(400).json(findError)
    }

    const score =
      opportunity.score || 0

    const notes = `
Lead vindo do Radar de Oportunidades.

Fonte: ${opportunity.source || "-"}
Categoria: ${opportunity.category || "-"}
Moto atual: ${opportunity.current_motorcycle || "-"}
Ano: ${opportunity.motorcycle_year || "-"}
KM: ${opportunity.mileage || "-"}
Uso profissional: ${opportunity.professional_use ? "Sim" : "Não"}
Prazo de compra: ${opportunity.purchase_timeline || "-"}
Probabilidade de troca: ${opportunity.trade_probability || 0}%

Observações:
${opportunity.notes || "-"}
    `

    const leadPayload = {
      company_name: opportunity.name,
      responsible: "",
      phone: opportunity.phone || "",
      whatsapp: opportunity.phone || "",
      instagram: opportunity.instagram || "",
      address: "",
      city: opportunity.city || "",
      status: "Novo Lead",
      interest: opportunity.category || "Não definido",
      notes,
      priority:
        score >= 70
          ? "Alta"
          : score >= 40
            ? "Média"
            : "Baixa",
      current_motorcycle:
        opportunity.current_motorcycle || "",
      motorcycle_year:
        opportunity.motorcycle_year || null,
      mileage:
        opportunity.mileage || null,
      professional_use:
        opportunity.professional_use || false,
      lead_source: "Radar",
      purchase_timeline:
        opportunity.purchase_timeline || "",
      lead_score: score,
      lead_temperature:
        getTemperature(score)
    }

    const { data, error } =
      await supabase
        .from("leads")
        .insert([
          leadPayload
        ])
        .select()

    if (error) {
      return res.status(400).json(error)
    }

    await supabase
      .from("opportunities")
      .update({
        status: "Enviado para CRM"
      })
      .eq("id", id)

    res.status(201).json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

module.exports = router