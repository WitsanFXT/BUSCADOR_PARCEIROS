const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

const {
  calculateLeadScore,
  getLeadTemperature
} = require("../utils/leadScore")

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/\D/g, "")
}

/* LISTAR LEADS */
router.get("/", async (req, res) => {

  try {

    const { data, error } =
      await supabase
        .from("leads")
        .select("*")
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

/* CRIAR LEAD */
router.post("/", async (req, res) => {

  try {

    const {
      company_name,
      responsible,
      phone,
      whatsapp,
      instagram,
      address,
      city,
      status,
      interest,
      notes,
      priority,
      current_motorcycle,
      motorcycle_year,
      mileage,
      professional_use,
      lead_source,
      purchase_timeline
    } = req.body

    if (!company_name) {
      return res.status(400).json({
        error: "Nome da empresa é obrigatório"
      })
    }

    const { data: existingLeads, error: searchError } =
      await supabase
        .from("leads")
        .select("*")

    if (searchError) {
      return res.status(400).json(searchError)
    }

    const companyNameNormalized =
      normalizeText(company_name)

    const cityNormalized =
      normalizeText(city)

    const phoneNormalized =
      normalizePhone(phone)

    const whatsappNormalized =
      normalizePhone(whatsapp)

    const duplicatedLead =
      existingLeads.find(lead => {

        const sameCompany =
          normalizeText(lead.company_name) ===
          companyNameNormalized

        const sameCity =
          cityNormalized &&
          normalizeText(lead.city) === cityNormalized

        const samePhone =
          phoneNormalized &&
          normalizePhone(lead.phone) === phoneNormalized

        const sameWhatsapp =
          whatsappNormalized &&
          normalizePhone(lead.whatsapp) === whatsappNormalized

        return (
          samePhone ||
          sameWhatsapp ||
          (
            sameCompany &&
            sameCity
          )
        )

      })

    if (duplicatedLead) {

      return res.status(409).json({
        error: "DUPLICATE_LEAD",
        message: "Este lead já está cadastrado",
        lead: duplicatedLead
      })

    }

    const leadPayload = {
      company_name,
      responsible,
      phone,
      whatsapp,
      instagram,
      address,
      city,
      status: status || "Novo Lead",
      interest,
      notes,
      priority: priority || "Média",
      current_motorcycle,
      motorcycle_year:
        motorcycle_year
          ? Number(motorcycle_year)
          : null,
      mileage:
        mileage
          ? Number(mileage)
          : null,
      professional_use:
        professional_use || false,
      lead_source:
        lead_source || "Manual",
      purchase_timeline:
        purchase_timeline || "Sem previsão"
    }

    const lead_score =
      calculateLeadScore(leadPayload)

    const lead_temperature =
      getLeadTemperature(lead_score)

    const { data, error } =
      await supabase
        .from("leads")
        .insert([
          {
            ...leadPayload,
            lead_score,
            lead_temperature
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
          title: "Novo Lead",
          message:
            `${company_name} foi cadastrado`,
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

/* EDITAR LEAD */
router.put("/:id", async (req, res) => {

  try {

    const { id } =
      req.params

    const { data: currentLead, error: findError } =
      await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single()

    if (findError) {
      return res.status(400).json(findError)
    }

    const updatedPayload = {
      ...currentLead,
      ...req.body
    }

    const lead_score =
      calculateLeadScore(updatedPayload)

    const lead_temperature =
      getLeadTemperature(lead_score)

    const { data, error } =
      await supabase
        .from("leads")
        .update({
          ...req.body,
          lead_score,
          lead_temperature
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

/* EXCLUIR LEAD */
router.delete("/:id", async (req, res) => {

  try {

    const { id } =
      req.params

    const { error } =
      await supabase
        .from("leads")
        .delete()
        .eq("id", id)

    if (error) {
      return res.status(400).json(error)
    }

    res.json({
      message: "Lead removido"
    })

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

module.exports = router