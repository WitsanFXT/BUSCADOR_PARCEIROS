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

const opportunitiesRoutes =
  require("./routes/opportunities.routes")

const agendaRoutes =
  require("./routes/agenda.routes")

const missionsRoutes =
  require("./routes/missions.routes")

const contentRoutes =
  require("./routes/content.routes")

const referralsRoutes =
  require("./routes/referrals.routes")

const salesFunnelRoutes =
  require("./routes/salesFunnel.routes")

const aiRoutes =
  require("./routes/ai.routes")

const assistantRoutes =
  require("./routes/assistant.routes")


/* CORS */
app.use(cors({
  origin: "*"
}))

/* JSON */
app.use(express.json())

/* ROOT */

app.get("/", (req, res) => {
  console.log("ROTA RAIZ CHAMADA")

  return res.status(200).json({
    message: "MotoLead Pro API",
    ok: true
  })
})

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

app.use(
  "/assistant",
  assistantRoutes
)

app.use(
  "/opportunities",
  opportunitiesRoutes
)

app.use(
  "/agenda",
  agendaRoutes
)

app.use(
  "/missions",
  missionsRoutes
)

app.use(
  "/content",
  contentRoutes
)

app.use(
  "/referrals",
  referralsRoutes
)

app.use(
  "/sales-funnel",
  salesFunnelRoutes
)

app.use(
  "/ai",
  aiRoutes
)


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