require("dotenv").config()

const express = require("express")
const cors = require("cors")

const app = express()

/* IMPORTS */
const leadsRoutes =
  require("./routes/leads.routes")

const mapsRoutes =
  require("./routes/maps.routes")

const searchRoutes =
  require("./routes/search.routes")

const notificationsRoutes =
  require("./routes/notifications.routes")

const checklistRoutes =
  require("./routes/checklist.routes")


/* CORS */
app.use(cors({
  origin: "*"
}))

/* JSON */
app.use(express.json())

/* LOG */
app.use((req, res, next) => {

  console.log(
    `${req.method} ${req.url}`
  )

  next()

})

/* ROUTES */
app.use(
  "/notifications",
  notificationsRoutes
)

app.use(
  "/leads",
  leadsRoutes
)

app.use(
  "/maps",
  mapsRoutes
)

app.use(
  "/search",
  searchRoutes
)

app.use(
  "/checklist",
  checklistRoutes
)

/* ROOT */
app.get("/", (req, res) => {

  res.json({
    message: "MotoLead Pro API"
  })

})

/* ERROR HANDLER */
app.use((err, req, res, next) => {

  console.log("ERRO GERAL:")
  console.log(err)

  res.status(500).json({
    error: err.message
  })

})

/* SERVER */
const PORT =
  process.env.PORT || 3001

app.listen(PORT, () => {

  console.log(
    `Servidor rodando na porta ${PORT}`
  )

})