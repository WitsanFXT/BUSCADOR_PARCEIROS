import { useEffect, useState } from "react"
import {
  MessageCircle,
  Copy,
  CalendarClock,
  Sparkles,
  RefreshCw
} from "lucide-react"

import api from "../services/api"

export default function Automation() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState(null)
  const [messages, setMessages] = useState({})
  const [toast, setToast] = useState(null)
  const [scheduleItem, setScheduleItem] = useState(null)

  const [scheduleForm, setScheduleForm] = useState({
    days: "3",
    notes: "Retornar contato e verificar interesse."
  })

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
  if (items.length > 0) {
    generateInitialMessages(items)
  }
}, [items])

  function showToast(type, title, message = "") {
    setToast({ type, title, message })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadItems() {
    try {
      setLoading(true)
      const response = await api.get("/agenda/priorities")
      setItems(response.data || [])
    } catch (err) {
      console.log(err)
      showToast("error", "Erro ao carregar", "Não foi possível carregar os contatos.")
    } finally {
      setLoading(false)
    }
  }

  function cleanPhone(phone) {
    return String(phone || "").replace(/\D/g, "")
  }

  function addDays(days) {
    const date = new Date()
    date.setDate(date.getDate() + Number(days || 0))
    return date.toISOString().split("T")[0]
  }

  function getObjective(item) {
    if (item.type === "opportunity") return "first_contact"
    if (item.type === "followup") return "followup"

    if (item.type === "lead") {
      if (item.status === "Perdido") return "recovery"
      if (item.status === "Negociando") return "simulation"
      if ((item.score || 0) >= 70) return "simulation"
      return "followup"
    }

    return "followup"
  }

  function fallbackMessage(item) {
    if (item.type === "opportunity") {
      return `Olá, ${item.title || "tudo bem"}? Vi uma oportunidade de conversar com você sobre uma moto Yamaha para sua rotina. Posso fazer uma simulação sem compromisso?`
    }

    if (item.type === "followup") {
      return `Olá, ${item.title || "tudo bem"}? Passando para retomar nosso contato. Você ainda tem interesse em avaliar uma condição de moto Yamaha?`
    }

    return `Olá, ${item.title || "tudo bem"}? Sou consultor Yamaha e queria entender se ainda faz sentido avaliarmos uma condição para sua próxima moto.`
  }

  function getKey(item) {
    return `${item.type}-${item.id}`
  }

  function getMessage(item) {
    return messages[getKey(item)]?.message || fallbackMessage(item)
  }

  async function generateInitialMessages(list) {
  const firstItems = list.slice(0, 5)

  for (const item of firstItems) {
    const key = getKey(item)

    if (!messages[key]) {
      await generateMessage(item)
    }
  }
}

  async function generateMessage(item) {
    const key = getKey(item)

    try {
      setGeneratingId(key)

      const response = await api.post("/assistant/generate", {
        objective: getObjective(item),
        lead_id: item.type === "lead" ? item.id : item.lead_id || null,
        extra: {
          context: `
Nome: ${item.title || ""}
Tipo: ${item.type || ""}
Cidade: ${item.city || "Não informada"}
Telefone: ${item.phone || ""}
Instagram: ${item.instagram || ""}
Origem: ${item.source || ""}
Status: ${item.status || ""}
Score: ${item.score || 0}
Temperatura: ${item.temperature || ""}
Chance: ${item.probability || 0}
Motivo: ${item.reason || ""}
          `
        }
      })

      const data = response.data || {}

      const message =
        data.message ||
        data.answer ||
        data.variations?.[0] ||
        fallbackMessage(item)

      setMessages(prev => ({
        ...prev,
        [key]: {
          title: data.title || "Mensagem IA",
          message
        }
      }))

      showToast("success", "Mensagem gerada", "A IA criou uma abordagem para este contato.")
    } catch (err) {
      console.log(err)
      showToast("error", "Erro na IA", "Não foi possível gerar a mensagem.")
    } finally {
      setGeneratingId(null)
    }
  }

  async function copyMessage(item) {
    try {
      await navigator.clipboard.writeText(getMessage(item))
      showToast("success", "Mensagem copiada", "Texto copiado para a área de transferência.")
    } catch {
      showToast("error", "Erro ao copiar", "Não foi possível copiar a mensagem.")
    }
  }

  function openWhatsApp(item) {
    const phone = cleanPhone(item.phone)

    if (!phone) {
      showToast("warning", "Sem WhatsApp", "Este contato não possui telefone.")
      return
    }

    const finalPhone = phone.startsWith("55") ? phone : `55${phone}`

    window.open(
      `https://wa.me/${finalPhone}?text=${encodeURIComponent(getMessage(item))}`,
      "_blank"
    )
  }

  function openInstagram(item) {
    const instagram = String(item.instagram || "").replace("@", "").trim()

    if (!instagram) {
      showToast("warning", "Sem Instagram", "Este contato ainda não possui Instagram cadastrado.")
      return
    }

    window.open(`https://instagram.com/${instagram}`, "_blank")
  }

  function openSchedule(item) {
    setScheduleItem(item)
    setScheduleForm({
      days: "3",
      notes: `Retornar contato com ${item.title || "cliente"} e verificar interesse.`
    })
  }

  async function scheduleReturn() {
    if (!scheduleItem) return

    const days = Number(scheduleForm.days)

    if (!days || days < 1) {
      showToast("warning", "Data inválida", "Informe um número de dias maior que zero.")
      return
    }

    try {
      await api.post("/agenda/followups", {
        lead_id:
          scheduleItem.type === "lead"
            ? scheduleItem.id
            : scheduleItem.lead_id || null,
        opportunity_id:
          scheduleItem.type === "opportunity"
            ? scheduleItem.id
            : scheduleItem.opportunity_id || null,
        title: scheduleItem.title,
        contact_name: scheduleItem.title,
        phone: scheduleItem.phone || "",
        source: "Automação Comercial",
        next_contact_date: addDays(days),
        notes: scheduleForm.notes
      })

      showToast("success", "Retorno agendado", "O contato foi enviado para a Agenda.")
      setScheduleItem(null)
      loadItems()
    } catch (err) {
      console.log(err)
      showToast("error", "Erro ao agendar", "Não foi possível agendar o retorno.")
    }
  }

  async function markFollowupDone(item) {
  if (item.type !== "followup") return

  try {
    await api.put(`/agenda/followups/${item.id}/done`)

    showToast(
      "success",
      "Follow-up concluído",
      "Este retorno foi marcado como feito."
    )

    loadItems()
  } catch (err) {
    console.log(err)

    showToast(
      "error",
      "Erro ao concluir",
      "Não foi possível marcar o follow-up como feito."
    )
  }
}

  function scoreColor(score) {
    if (score >= 70) return "bg-red-600"
    if (score >= 40) return "bg-yellow-500 text-black"
    return "bg-blue-600"
  }

  const hot = items.filter(item => (item.score || 0) >= 70).length
  const followups = items.filter(item => item.type === "followup").length

  const toastColors = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-600 text-white"
  }

  if (loading) {
    return <div className="text-white">Carregando automação...</div>
  }

  return (
    <div className="text-white space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Copilot Comercial</h1>
          <p className="text-slate-400 mt-2">
            Contatos priorizados pela IA, com mensagem pronta, WhatsApp e retorno agendado.
          </p>
        </div>

        <button
          onClick={loadItems}
          className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">Prontos para contato</p>
          <h2 className="text-4xl font-bold mt-2">{items.length}</h2>
        </div>

        <div className="bg-green-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">Leads quentes</p>
          <h2 className="text-4xl font-bold mt-2">{hot}</h2>
        </div>

        <div className="bg-blue-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">Follow-ups</p>
          <h2 className="text-4xl font-bold mt-2">{followups}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {items.map(item => {
          const key = getKey(item)
          const message = getMessage(item)

          return (
            <div
              key={key}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`${scoreColor(item.score || 0)} px-3 py-1 rounded-xl text-xs font-bold`}>
                  Score {item.score || 0}
                </span>

                <span className="bg-slate-700 px-3 py-1 rounded-xl text-xs font-bold">
                  {item.type || "contato"}
                </span>

                <span className="bg-blue-600 px-3 py-1 rounded-xl text-xs font-bold">
                  {item.probability || 0}% chance
                </span>

                {item.temperature && (
                  <span className="bg-orange-600 px-3 py-1 rounded-xl text-xs font-bold">
                    {item.temperature}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold break-words">
                {item.title || "Contato sem nome"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-slate-400">
                <p>{item.city || "Cidade não informada"}</p>
                <p>{item.source || "Origem não informada"}</p>

                {item.phone && (
                  <p className="flex items-center gap-2">
                    ☎️
                    {item.phone}
                  </p>
                )}

                {item.instagram && (
                  <p className="flex items-center gap-2">
                    📸
                    @{String(item.instagram).replace("@", "")}
                  </p>
                )}
              </div>

              {item.reason && (
                <p className="text-slate-300 mt-4 break-words whitespace-pre-line">
                  {item.reason}
                </p>
              )}

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mt-5">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold mb-2">
                  <Sparkles size={16} />
                  Mensagem pronta
                </div>

                <p className="text-slate-200 whitespace-pre-line break-words">
                  {message}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
                <button
                  onClick={() => generateMessage(item)}
                  disabled={generatingId === key}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles size={18} />
                  {generatingId === key ? "Gerando..." : "Gerar IA"}
                </button>

                <button
                  onClick={() => copyMessage(item)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Copy size={18} />
                  Copiar
                </button>

                <button
                  onClick={() => openWhatsApp(item)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </button>

                <button
                  onClick={() => openInstagram(item)}
                  className="bg-pink-600 hover:bg-pink-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  📸 Instagram
                </button>

                <button
                  onClick={() => openSchedule(item)}
                  className="bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-xl font-bold text-black flex items-center justify-center gap-2 sm:col-span-2"
                >
                  <CalendarClock size={18} />
                  Agendar retorno
                </button>

              {item.type === "followup" && (
  <button
    onClick={() => markFollowupDone(item)}
    className="bg-emerald-600 hover:bg-emerald-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 sm:col-span-2 xl:col-span-1"
  >
    ✅ Marcar como feito
  </button>
)}

              </div>
            </div>
          )
        })}

        {items.length === 0 && (
          <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400">
            Nenhum lead pronto para automação agora.
          </div>
        )}
      </div>

      {scheduleItem && (
        <div className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold">Agendar retorno</h2>

            <p className="text-slate-400 mt-2 break-words">
              {scheduleItem.title}
            </p>

            <div className="mt-5 space-y-4">
              <input
                type="number"
                min="1"
                value={scheduleForm.days}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    days: e.target.value
                  })
                }
                className="w-full bg-slate-800 p-3 rounded-xl outline-none"
                placeholder="Daqui quantos dias?"
              />

              <textarea
                value={scheduleForm.notes}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    notes: e.target.value
                  })
                }
                className="w-full bg-slate-800 p-3 rounded-xl outline-none min-h-28"
                placeholder="Observação"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setScheduleItem(null)}
                className="bg-slate-700 hover:bg-slate-600 p-3 rounded-xl font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={scheduleReturn}
                className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded-xl font-bold text-black"
              >
                Agendar retorno
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className={`${toastColors[toast.type] || toastColors.info} px-6 py-4 rounded-2xl shadow-2xl max-w-sm`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold">{toast.title}</h3>

                {toast.message && (
                  <p className="text-sm mt-1 opacity-90">
                    {toast.message}
                  </p>
                )}
              </div>

              <button onClick={() => setToast(null)} className="font-bold">
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}