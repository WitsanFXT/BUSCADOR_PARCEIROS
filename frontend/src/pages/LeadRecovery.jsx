import { useEffect, useState } from "react"
import api from "../services/api"

export default function LeadRecovery() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState(null)
  const [messagesByLead, setMessagesByLead] = useState({})

  useEffect(() => {
    loadRecoveryLeads()
  }, [])

  async function loadRecoveryLeads() {
    try {
      const response =
        await api.get("/ai/recovery-leads")

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

  function buildLeadPayload(item) {
    return {
      id: item.lead_id,
      company_name: item.company_name,
      responsible: item.responsible,
      phone: item.phone,
      whatsapp: item.phone,
      city: item.city,
      status: item.status,
      lead_score: item.score,
      lead_temperature: item.temperature
    }
  }

  async function generateMessage(item) {
    try {
      setGeneratingId(item.lead_id)

      const response =
        await api.post(
          "/ai/conversion-message",
          buildLeadPayload(item)
        )

      const messages =
        response.data || []

      const recoveryMessage =
        messages.find(msg => msg.type === "followup") ||
        messages.find(msg => msg.type === "closing") ||
        messages[0]

      setMessagesByLead({
        ...messagesByLead,
        [item.lead_id]: recoveryMessage?.message || ""
      })

      await api.post("/ai/actions", {
        lead_id: item.lead_id,
        action_type: "recovery_message_generated",
        action_title: "Mensagem de recuperação gerada",
        message: recoveryMessage?.message || ""
      })

    } catch (err) {
      console.log(err)
      alert("Erro ao gerar mensagem")
    } finally {
      setGeneratingId(null)
    }
  }

  async function openWhatsApp(item) {
    const phone = cleanPhone(item.phone)

    if (!phone) {
      alert("Este lead não possui telefone.")
      return
    }

    const message =
      messagesByLead[item.lead_id] ||
      `Olá ${item.responsible || ""}, tudo bem? Estou passando para retomar nosso contato sobre uma oportunidade da Yamaha para você.`

    await api.post("/ai/actions", {
      lead_id: item.lead_id,
      action_type: "recovery_whatsapp_opened",
      action_title: "Recuperação aberta no WhatsApp",
      message
    })

    window.open(
      `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    )

    loadRecoveryLeads()
  }

  async function copyMessage(item) {
    const message =
      messagesByLead[item.lead_id]

    if (!message) return

    await navigator.clipboard.writeText(message)

    await api.post("/ai/actions", {
      lead_id: item.lead_id,
      action_type: "recovery_message_copied",
      action_title: "Mensagem de recuperação copiada",
      message
    })

    alert("Mensagem copiada!")
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
        Carregando leads para recuperação...
      </div>
    )
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Recuperação de Leads IA
        </h1>

        <p className="text-slate-400 mt-2">
          Encontre leads quentes esquecidos e retome o contato no momento certo.
        </p>
      </div>

      {!items.length && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold">
            Nenhum lead parado encontrado
          </h2>

          <p className="text-slate-400 mt-3">
            Ótimo sinal: os leads quentes estão sendo acompanhados.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const message =
            messagesByLead[item.lead_id]

          return (
            <div
              key={item.lead_id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-3 mb-3">
                    <span className="bg-red-600 px-4 py-2 rounded-xl text-sm font-bold">
                      Recuperação
                    </span>

                    <span className="bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold">
                      Score {item.score}
                    </span>

                    <span className="bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold">
                      {item.temperature}
                    </span>

                    <span className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-bold">
                      Recovery {item.recovery_score}
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
                    <strong>Motivo:</strong> {item.reason}
                  </p>

                  <p className="text-slate-400 mt-2">
                    <strong>Ação:</strong> {item.recommended_action}
                  </p>

                  {message && (
                    <div className="mt-5 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <p className="text-sm text-slate-400 mb-2">
                        Mensagem de recuperação:
                      </p>

                      <p className="text-slate-200 whitespace-pre-line">
                        {message}
                      </p>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={() => copyMessage(item)}
                          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-bold"
                        >
                          Copiar
                        </button>

                        <button
                          onClick={() => openWhatsApp(item)}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-bold"
                        >
                          Enviar no WhatsApp
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 min-w-[210px]">
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