const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

router.get("/", async (req,res)=>{

  const today =
    new Date()
      .toISOString()
      .split("T")[0]

  const { data,error } =
    await supabase
      .from("checklist_daily")
      .select("*")
      .eq(
        "contact_date",
        today
      )

  if(error)
    return res.status(400)
      .json(error)

  res.json(data)

})

router.post("/", async (req,res)=>{

  const {
    lead_id,
    completed
  } = req.body

  const today =
    new Date()
      .toISOString()
      .split("T")[0]

  const { data,error } =
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

  if(error)
    return res.status(400)
      .json(error)

  res.json(data)

})

module.exports = router