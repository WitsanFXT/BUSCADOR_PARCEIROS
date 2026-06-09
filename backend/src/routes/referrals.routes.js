const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

router.get("/partners", async (req, res) => {

  try {

    const { data, error } =
      await supabase
        .from("referral_partners")
        .select("*")
        .order("created_at", {
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

router.post("/partners", async (req, res) => {

  try {

    const { data, error } =
      await supabase
        .from("referral_partners")
        .insert([req.body])
        .select()

    if (error) return res.status(400).json(error)

    res.status(201).json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

router.delete("/partners/:id", async (req, res) => {

  try {

    const { id } = req.params

    const { error } =
      await supabase
        .from("referral_partners")
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

router.get("/", async (req, res) => {

  try {

    const { data, error } =
      await supabase
        .from("referrals")
        .select(`
          *,
          referral_partners (
            name,
            type,
            city,
            commission_value
          )
        `)
        .order("created_at", {
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

    const { data, error } =
      await supabase
        .from("referrals")
        .insert([req.body])
        .select()

    if (error) return res.status(400).json(error)

    await supabase
      .from("notifications")
      .insert([
        {
          title: "Nova indicação",
          message: `${req.body.customer_name} foi indicado`,
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

    const { id } = req.params

    const { data, error } =
      await supabase
        .from("referrals")
        .update(req.body)
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

    const { id } = req.params

    const { error } =
      await supabase
        .from("referrals")
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

router.post("/:id/to-lead", async (req, res) => {

  try {

    const { id } = req.params

    const { data: referral, error: findError } =
      await supabase
        .from("referrals")
        .select(`
          *,
          referral_partners (
            name,
            type,
            city
          )
        `)
        .eq("id", id)
        .single()

    if (findError) return res.status(400).json(findError)

    const { data, error } =
      await supabase
        .from("leads")
        .insert([
          {
            company_name: referral.customer_name,
            responsible: "",
            phone: referral.customer_phone || "",
            whatsapp: referral.customer_phone || "",
            instagram: "",
            address: "",
            city: referral.referral_partners?.city || "",
            status: "Novo Lead",
            interest: referral.motorcycle_interest || "Indicação",
            notes: `Lead vindo por indicação de ${referral.referral_partners?.name || "parceiro"}.\n\n${referral.notes || ""}`,
            priority: "Alta",
            lead_source: "Indicação",
            lead_score: 80,
            lead_temperature: "Quente"
          }
        ])
        .select()

    if (error) return res.status(400).json(error)

    await supabase
      .from("referrals")
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