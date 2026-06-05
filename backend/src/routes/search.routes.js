const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

router.get("/", async (req, res) => {

  try {

    const { q } = req.query

    if (!q || q.trim() === "") {
      return res.json([])
    }

    const search =
      q.trim()

    const { data, error } =
      await supabase
        .from("leads")
        .select("*")
        .or(
          `company_name.ilike.%${search}%,city.ilike.%${search}%,responsible.ilike.%${search}%,phone.ilike.%${search}%`
        )
        .limit(20)

    if (error) {

      console.log(error)

      return res.status(400).json(error)

    }

    res.json(data || [])

  } catch (err) {

    console.log(err)

    res.status(500).json({
      error: err.message
    })

  }

})

module.exports = router