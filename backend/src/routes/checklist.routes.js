const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

router.get("/", async (req, res) => {

  const today =
    new Date()
      .toISOString()
      .split("T")[0]

  const { data, error } =
    await supabase
      .from("checklist_daily")
      .select("*")
      .eq(
        "contact_date",
        today
      )

  if (error)
    return res.status(400)
      .json(error)

  res.json(data)

})

router.get("/all", async (req, res) => {

  const { data, error } =
    await supabase
      .from("checklist_daily")
      .select("*")
      .order(
        "contact_date",
        {
          ascending: false
        }
      )

  if (error)
    return res.status(400)
      .json(error)

  res.json(data)

})

router.post("/", async (req, res) => {

  const {
    lead_id,
    completed
  } = req.body

  const today =
    new Date()
      .toISOString()
      .split("T")[0]

  const { data, error } =
    await supabase
      .from("checklist_daily")
      .upsert([
        {
          lead_id,
          contact_date: today,
          completed
        }
      ])
      .select()

  if (error)
    return res.status(400)
      .json(error)

  res.json(data)

})

router.delete("/:lead_id", async (req, res) => {

  const {
    lead_id
  } = req.params

  const today =
    new Date()
      .toISOString()
      .split("T")[0]

  const { error } =
    await supabase
      .from("checklist_daily")
      .delete()
      .eq(
        "lead_id",
        lead_id
      )
      .eq(
        "contact_date",
        today
      )

  if (error) {
    return res.status(400)
      .json(error)
  }

  res.json({
    success: true
  })

})

module.exports = router