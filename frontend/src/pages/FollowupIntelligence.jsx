import { useEffect, useState } from "react"
import api from "../services/api"

export default function FollowupIntelligence() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  async function loadAlerts() {
    try {
      const response =
        await api.get("/ai/followup-alerts")

      setItems(response.data || [])
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  function cleanPhone(phone) {
    return String(phone || "").replace(/\D/g, "")
  }

  async function openWhatsApp(item) {
    const phone = cleanPhone(item.phone)

    if (!phone) {
      alert("Este lead não possui telefone.")
      return
    }

    const message =
      `Olá ${item.responsible || ""}, tudo bem? Estou passando para retomar nosso contato sobre uma oportunidade da Yamaha para você.`

    await api.post("/ai/actions", {
      lead_id: item.lead_id,
      action_type: "followup_whatsapp_opened",
      action_title: "Follow-up aberto no WhatsApp",
      message
    })

    window.open(
      `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    )

    loadAlerts()
  }

  function levelColor(level) {
    if (level === "CRITICO") return "bg-red-600"
    if (level === "ATENCAO") return "bg-yellow-500 text-black"
    return "bg-green-600"
  }

  function levelText(level) {
    if (level === "CRITICO") return "Crítico"
    if (level === "ATENCAO") return "Atenção"
    return "Em dia"
  }

  function daysText(days) {
    if (days === 999) return "Nunca contatado"
    if (days === 0) return "Contato hoje"
    if (days === 1) return "1 dia sem contato"
    return `${days} dias sem contato`
  }

  if (loading) {
    return (
      <div className="text-white">
        Carregando follow-ups inteligentes...
      </div>
    )
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Follow-up Inteligente
        </h1>

        <p className="text-slate-400 mt-2">
          A IA identifica leads parados, críticos e em dia.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.lead_id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex flex-wrap gap-3 mb-3">
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold ${levelColor(item.level)}`}>
                    {levelText(item.level)}
                  </span>

                  <span className="bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold">
                    Score {item.score}
                  </span>

                  <span className="bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold">
                    {item.temperature}
                  </span>

                  <span className="bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold">
                    {daysText(item.days_without_contact)}
                  </span>
                </div>

                <h2 className="text-2xl font-bold">
                  {item.company_name}
                </h2>

                <p className="text-slate-400 mt-1">
                  {item.city || "Cidade não informada"} • {item.status}
                </p>

                <p className="text-slate-300 mt-4">
                  <strong>Recomendação:</strong> {item.recommendation}
                </p>

                <p className="text-slate-400 mt-2">
                  {item.reason}
                </p>

                {item.last_action && (
                  <p className="text-slate-500 mt-3 text-sm">
                    Última ação: {item.last_action.title}
                  </p>
                )}
              </div>

              <button
                onClick={() => openWhatsApp(item)}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold"
              >
                Fazer follow-up
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}