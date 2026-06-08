const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

async function cleanupOldNotifications() {

  const { data, error } =
    await supabase
      .from("notifications")
      .select("id")
      .order(
        "created_at",
        {
          ascending: false
        }
      )

  if (error || !data) return

  const oldNotifications =
    data.slice(15)

  if (oldNotifications.length === 0) return

  const oldIds =
    oldNotifications.map(item => item.id)

  await supabase
    .from("notifications")
    .delete()
    .in(
      "id",
      oldIds
    )

}

/*
=================================
LISTAR NOTIFICAÇÕES
=================================
*/

router.get("/", async (req, res) => {

  try {

    await cleanupOldNotifications()

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
        .limit(15)

    if (error) {

      return res
        .status(400)
        .json(error)

    }


    console.log(
  data.map(n => ({
    title: n.title,
    read: n.read
  }))
)

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
            message,
            read: false
          }
        ])
        .select()

    if (error) {

      return res
        .status(400)
        .json(error)

    }

    await cleanupOldNotifications()

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

    const updateFalse =
      await supabase
        .from("notifications")
        .update({
          read: true
        })
        .eq("read", false)

    if (updateFalse.error) {
      return res
        .status(400)
        .json(updateFalse.error)
    }

    const updateNull =
      await supabase
        .from("notifications")
        .update({
          read: true
        })
        .is("read", null)

    if (updateNull.error) {
      return res
        .status(400)
        .json(updateNull.error)
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