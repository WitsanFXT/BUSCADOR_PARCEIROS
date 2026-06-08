const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

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
      priority
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

    const { data, error } =
      await supabase
        .from("leads")
        .insert([
          {
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
            priority
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

    const { id } = req.params

    const { data, error } =
      await supabase
        .from("leads")
        .update(req.body)
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

    const { id } = req.params

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