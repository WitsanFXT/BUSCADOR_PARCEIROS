const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

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

    console.log("BODY RECEBIDO:")
    console.log(req.body)

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

      console.log("ERRO SUPABASE:")
      console.log(error)

      return res.status(400).json(error)

    }

    /* CRIA NOTIFICAÇÃO AUTOMÁTICA */
    await supabase
      .from("notifications")
      .insert([
        {
          title: "Novo Lead",
          message:
            `${company_name} foi cadastrado`
        }
      ])

    res.status(201).json(data)

  } catch (err) {

    console.log(err)

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
