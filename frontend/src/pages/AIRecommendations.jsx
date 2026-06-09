import { useEffect, useState } from "react"
import api from "../services/api"

export default function AIRecommendations() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState(null)
  const [messagesByLead, setMessagesByLead] = useState({})
  const [actionsByLead, setActionsByLead] = useState({})
  const [objectiveByLead, setObjectiveByLead] = useState({})

  useEffect(() => {
    loadRecommendations()
  }, [])

  async function loadRecommendations() {
    try {
      const response = await api.get("/ai/recommendations")
      const recommendations = response.data || []

      setItems(recommendations)

      recommendations.forEach((item) => {
        loadActions(item.lead_id)
      })
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadActions(leadId) {
    try {
      const response =
        await api.get(`/ai/actions/${leadId}`)

      setActionsByLead((prev) => ({
        ...prev,
        [leadId]: response.data || []
      }))
    } catch (err) {
      console.log(err)
    }
  }

  async function registerAction(
    item,
    actionType,
    actionTitle,
    message = ""
  ) {
    try {
      await api.post("/ai/actions", {
        lead_id: item.lead_id,
        action_type: actionType,
        action_title: actionTitle,
        message
      })

      loadActions(item.lead_id)
    } catch (err) {
      console.log(err)
    }
  }

  function cleanPhone(phone) {
    return String(phone || "").replace(/\D/g, "")
  }

  function buildLeadPayload(item) {
    return {
      id: item.lead_id,
      company_name: item.company_name,
      responsible: item.responsible,
      phone: item.phone,
      whatsapp: item.phone,
      city: item.city,
      status: item.status,
      current_motorcycle: item.current_motorcycle,
      professional_use: item.professional_use,
      purchase_timeline: item.purchase_timeline,
      lead_score: item.score,
      lead_temperature: item.temperature
    }
  }

  async function generateMessage(item) {
  try {
    setGeneratingId(item.lead_id)

    const objective =
      objectiveByLead[item.lead_id] ||
      "followup"

    const response =
      await api.post(
        "/assistant/generate",
        {
          objective,
          lead_id: item.lead_id
        }
      )

    const aiResult =
      response.data

    setMessagesByLead({
      ...messagesByLead,
      [item.lead_id]: [
        {
          type: objective,
          title:
            aiResult.title ||
            "Mensagem IA",
          message:
            aiResult.message ||
            aiResult.answer ||
            aiResult.variations?.[0] ||
            ""
        }
      ]
    })

    await registerAction(
      item,
      "generated_ai_message",
      `IA gerou ${objective}`,
      aiResult.message ||
      aiResult.answer ||
      aiResult.variations?.[0] ||
      ""
    )

  } catch (err) {

    console.log(err)

    alert(
      "Erro ao gerar conteúdo IA"
    )

  } finally {

    setGeneratingId(null)

  }
}

  function getBestMessage(item) {
    const messages =
      messagesByLead[item.lead_id] || []

    if (!messages.length) return ""

    if (item.action === "Ligar hoje") {
      return (
        messages.find(msg => msg.type === "closing") ||
        messages[0]
      ).message
    }

    if (item.action === "Enviar proposta") {
      return (
        messages.find(msg => msg.type === "simulation") ||
        messages[0]
      ).message
    }

    if (item.action === "Enviar simulação") {
      return (
        messages.find(msg => msg.type === "simulation") ||
        messages[0]
      ).message
    }

    if (item.action === "Fazer follow-up consultivo") {
      return (
        messages.find(msg => msg.type === "followup") ||
        messages[0]
      ).message
    }

    return messages[0].message
  }

  async function openWhatsApp(item, customMessage = "") {
    const phone = cleanPhone(item.phone)

    if (!phone) {
      alert("Este lead não possui telefone.")
      return
    }

    const message =
      customMessage ||
      getBestMessage(item) ||
      `Olá ${item.responsible || ""}, tudo bem? Estou passando para falar sobre uma oportunidade da Yamaha para você.`

    await registerAction(
      item,
      "whatsapp_opened",
      "WhatsApp aberto",
      message
    )

    window.open(
      `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    )
  }

  async function copyMessage(item, text) {
    navigator.clipboard.writeText(text)

    await registerAction(
      item,
      "message_copied",
      "Mensagem copiada",
      text
    )

    alert("Mensagem copiada!")
  }

  function priorityColor(priority) {
    if (priority <= 2) return "bg-red-600"
    if (priority <= 4) return "bg-yellow-500 text-black"
    return "bg-slate-700"
  }

  function formatDate(date) {
    if (!date) return ""

    return new Date(date).toLocaleString("pt-BR")
  }

  if (loading) {
    return (
      <div className="text-white">
        Carregando recomendações...
      </div>
    )
  }

  const objectives = [
  {
    value: "first_contact",
    label: "Primeiro Contato"
  },
  {
    value: "followup",
    label: "Follow-up"
  },
  {
    value: "recovery",
    label: "Recuperação"
  },
  {
    value: "simulation",
    label: "Simulação"
  },
  {
    value: "objection",
    label: "Objeção"
  },
  {
    value: "closing",
    label: "Fechamento"
  },
  {
    value: "referral",
    label: "Indicação"
  }
]

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Central de Prioridades IA
        </h1>

        <p className="text-slate-400 mt-2">
          Veja quais leads atacar primeiro, gere a mensagem certa e acompanhe o histórico comercial.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const leadMessages =
            messagesByLead[item.lead_id] || []

          const bestMessage =
            getBestMessage(item)

          const actions =
            actionsByLead[item.lead_id] || []

          return (
            <div
              key={item.lead_id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold ${priorityColor(item.priority)}`}>
                      Prioridade {item.priority}
                    </span>

                    <span className="bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold">
                      Score {item.score}
                    </span>

                    <span className="bg-red-600 px-4 py-2 rounded-xl text-sm font-bold">
                      {item.temperature}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">
                    {item.company_name}
                  </h2>

                  <p className="text-slate-400 mt-1">
                    {item.city || "Cidade não informada"} • {item.status}
                  </p>

                  <p className="text-slate-300 mt-4">
                    <strong>Ação recomendada:</strong> {item.action}
                  </p>

                  <p className="text-slate-400 mt-2">
                    {item.reason}
                  </p>

                  {item.current_motorcycle && (
                    <p className="text-slate-400 mt-2">
                      Moto atual: {item.current_motorcycle}
                    </p>
                  )}

                  {leadMessages.length > 0 && (
                    <div className="mt-5 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-sm text-slate-400 mb-2">
                        Mensagem sugerida pela IA:
                      </p>

                      <p className="text-slate-200 whitespace-pre-line">
                        {bestMessage}
                      </p>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={() => copyMessage(item, bestMessage)}
                          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-bold"
                        >
                          Copiar
                        </button>

                        <button
                          onClick={() => openWhatsApp(item, bestMessage)}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-bold"
                        >
                          Enviar no WhatsApp
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                    <h3 className="font-bold mb-3">
                      Histórico comercial
                    </h3>

                    {!actions.length && (
                      <p className="text-slate-500 text-sm">
                        Nenhuma ação registrada ainda.
                      </p>
                    )}

                    <div className="space-y-3">
                      {actions.slice(0, 5).map((action) => (
                        <div
                          key={action.id}
                          className="border-b border-slate-800 pb-3 last:border-b-0"
                        >
                          <p className="font-bold text-slate-200">
                            {action.action_title}
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatDate(action.created_at)}
                          </p>

                          {action.message && (
                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                              {action.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[190px]">

                <select
  value={
    objectiveByLead[item.lead_id] ||
    "followup"
  }
  onChange={(e) =>
    setObjectiveByLead({
      ...objectiveByLead,
      [item.lead_id]:
        e.target.value
    })
  }
  className="
    bg-slate-800
    rounded-xl
    p-3
    text-white
  "
>
  {objectives.map(obj => (
    <option
      key={obj.value}
      value={obj.value}
    >
      {obj.label}
    </option>
  ))}
</select>
                  <button
                    onClick={() => generateMessage(item)}
                    disabled={generatingId === item.lead_id}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    {generatingId === item.lead_id
                      ? "Gerando..."
                      : "Gerar mensagem"}
                  </button>

                  <button
                    onClick={() => openWhatsApp(item)}
                    className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold"
                  >
                    WhatsApp rápido
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}