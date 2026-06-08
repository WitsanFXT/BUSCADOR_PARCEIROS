const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

function todayDate() {
  return new Date()
    .toISOString()
    .split("T")[0]
}

const defaultMissions = [
  {
    title: "Novas conversas no WhatsApp",
    category: "WhatsApp",
    target: 10
  },
  {
    title: "Contatos no Marketplace",
    category: "Marketplace",
    target: 10
  },
  {
    title: "Pedidos de indicação",
    category: "Indicação",
    target: 5
  },
  {
    title: "Vídeo para Instagram",
    category: "Conteúdo",
    target: 1
  },
  {
    title: "Publicação no Status",
    category: "WhatsApp Status",
    target: 1
  },
  {
    title: "Follow-ups realizados",
    category: "Follow-up",
    target: 3
  }
]

async function ensureTodayMissions() {

  const today =
    todayDate()

  const rows =
    defaultMissions.map(item => ({
      mission_date: today,
      title: item.title,
      category: item.category,
      target: item.target,
      completed: 0
    }))

  await supabase
    .from("daily_missions")
    .upsert(
      rows,
      {
        onConflict: "mission_date,title",
        ignoreDuplicates: true
      }
    )

}

router.get("/", async (req, res) => {

  try {

    await ensureTodayMissions()

    const today =
      todayDate()

    const { data, error } =
      await supabase
        .from("daily_missions")
        .select("*")
        .eq("mission_date", today)
        .order("created_at", {
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

router.put("/:id", async (req, res) => {

  try {

    const { id } =
      req.params

    const {
      completed
    } = req.body

    const { data, error } =
      await supabase
        .from("daily_missions")
        .update({
          completed
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

router.post("/reset", async (req, res) => {

  try {

    const today =
      todayDate()

    const { error } =
      await supabase
        .from("daily_missions")
        .delete()
        .eq("mission_date", today)

    if (error) {
      return res.status(400).json(error)
    }

    await ensureTodayMissions()

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