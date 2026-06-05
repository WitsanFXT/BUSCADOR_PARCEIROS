const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

/*
=================================
LISTAR NOTIFICAÇÕES
=================================
*/

router.get("/", async (req, res) => {

  try {

    const { data, error } =
      await supabase
        .from("notifications")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        )

    if (error) {

      return res
        .status(400)
        .json(error)

    }

    res.json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

/*
=================================
CRIAR NOTIFICAÇÃO
=================================
*/

router.post("/", async (req, res) => {

  try {

    const title =
      req.body?.title || ""

    const message =
      req.body?.message || ""

    if (!title || !message) {

      return res.status(400).json({
        error:
          "Título e mensagem são obrigatórios"
      })

    }

    const { data, error } =
      await supabase
        .from("notifications")
        .insert([
          {
            title,
            message
          }
        ])
        .select()

    if (error) {

      return res
        .status(400)
        .json(error)

    }

    res.status(201).json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

/*
=================================
EXCLUIR NOTIFICAÇÃO
=================================
*/

router.delete("/:id", async (req, res) => {

  try {

    const { id } =
      req.params

    const { error } =
      await supabase
        .from("notifications")
        .delete()
        .eq("id", id)

    if (error) {

      return res
        .status(400)
        .json(error)

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

/*
=================================
MARCAR TODAS COMO LIDAS
=================================
*/

router.put("/read-all", async (req, res) => {

  try {

    const { error } =
      await supabase
        .from("notifications")
        .update({
          read: true
        })
        .eq("read", false)

    if (error) {

      return res
        .status(400)
        .json(error)

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