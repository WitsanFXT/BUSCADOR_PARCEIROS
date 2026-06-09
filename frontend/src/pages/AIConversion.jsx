import { useEffect, useState } from "react"
import api from "../services/api"

export default function AIConversion() {
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    try {
      const response = await api.get("/leads")
      setLeads(response.data || [])
    } catch (err) {
      console.log(err)
    }
  }

  function getCurrentLead() {
    return leads.find(
      item => String(item.id) === String(selectedLead)
    )
  }

  async function generateMessages() {
    if (!selectedLead) return

    try {
      setLoading(true)

      const lead = getCurrentLead()

      const response =
        await api.post(
          "/ai/conversion-message",
          lead
        )

      setMessages(response.data)

    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  function copyMessage(text) {
    navigator.clipboard.writeText(text)
    alert("Mensagem copiada!")
  }

  function cleanPhone(phone) {
    return String(phone || "")
      .replace(/\D/g, "")
  }

  function openWhatsApp(message) {
    const lead = getCurrentLead()

    if (!lead) {
      alert("Selecione um lead primeiro.")
      return
    }

    const phone =
      cleanPhone(lead.whatsapp || lead.phone)

    if (!phone) {
      alert("Este lead não possui WhatsApp ou telefone.")
      return
    }

    const whatsappUrl =
      `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`

    window.open(
      whatsappUrl,
      "_blank"
    )
  }

  return (
    <div className="text-white">

      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          IA de Conversão
        </h1>

        <p className="text-slate-400 mt-2">
          Gere mensagens inteligentes e envie direto pelo WhatsApp.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <select
          value={selectedLead}
          onChange={(e) => {
            setSelectedLead(e.target.value)
            setMessages([])
          }}
          className="w-full bg-slate-800 p-4 rounded-xl"
        >
          <option value="">
            Selecione um lead
          </option>

          {leads.map(lead => (
            <option
              key={lead.id}
              value={lead.id}
            >
              {lead.company_name}
              {lead.lead_temperature
                ? ` • ${lead.lead_temperature}`
                : ""}
              {lead.lead_score
                ? ` • Score ${lead.lead_score}`
                : ""}
            </option>
          ))}
        </select>

        <button
          onClick={generateMessages}
          disabled={loading || !selectedLead}
          className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {loading
            ? "Gerando..."
            : "Gerar Mensagens"}
        </button>
      </div>

      <div className="mt-8 space-y-4">
        {messages.map((item, index) => (
          <div
            key={index}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <h2 className="text-xl font-bold">
                {item.title}
              </h2>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    copyMessage(item.message)
                  }
                  className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl"
                >
                  Copiar
                </button>

                <button
                  onClick={() =>
                    openWhatsApp(item.message)
                  }
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-bold"
                >
                  Abrir WhatsApp
                </button>
              </div>
            </div>

            <p className="mt-4 text-slate-300 whitespace-pre-line">
              {item.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}