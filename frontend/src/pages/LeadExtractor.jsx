import { useEffect, useState } from "react"
import api from "../services/api"

export default function LeadExtractor() {
  const [source, setSource] = useState("Instagram")
  const [city, setCity] = useState("")
  const [text, setText] = useState("")
  const [items, setItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [statusFilter, setStatusFilter] = useState("pending")
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    loadExtractedLeads()
  }, [statusFilter])

  async function loadExtractedLeads() {
    try {
      const response =
        await api.get(
          `/assistant/extracted-leads?status=${statusFilter}`
        )

      setItems(response.data || [])
      setCurrentIndex(0)
    } catch (err) {
      console.log(err)
    }
  }

  async function extractLeads() {
    if (!text.trim()) {
      alert("Cole um texto para extrair leads.")
      return
    }

    try {
      setLoading(true)

      const response =
        await api.post("/assistant/extract-leads", {
          source,
          city,
          text
        })

      setItems(response.data.leads || [])
      setCurrentIndex(0)
      setStatusFilter("pending")

      alert("Leads extraídos com sucesso!")
    } catch (err) {
      console.log(err)
      alert("Erro ao extrair leads.")
    } finally {
      setLoading(false)
    }
  }

  async function updateLeadStatus(id, status) {
    try {
      await api.put(
        `/assistant/extracted-leads/${id}/status`,
        { status }
      )

      setItems(prev =>
        prev.filter(item => item.id !== id)
      )

      setCurrentIndex(0)
    } catch (err) {
      console.log(err)
      alert("Erro ao atualizar lead.")
    }
  }

  async function sendToCRM(item) {
    try {
      setSavingId(item.id)

      await api.post(
        `/assistant/extracted-leads/${item.id}/send-crm`
      )

      setItems(prev =>
        prev.filter(lead => lead.id !== item.id)
      )

      setCurrentIndex(0)

      alert("Lead enviado para o CRM!")
    } catch (err) {
      console.log(err)
      alert("Erro ao enviar para o CRM.")
    } finally {
      setSavingId(null)
    }
  }

  function currentLead() {
    return items[currentIndex] || null
  }

  function nextLead() {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  function previousLead() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  function scoreColor(score) {
    if (score >= 70) return "bg-red-600"
    if (score >= 40) return "bg-yellow-500 text-black"
    return "bg-slate-700"
  }

  function statusLabel(status) {
    if (status === "pending") return "Pendentes"
    if (status === "approved") return "Aprovados"
    if (status === "rejected") return "Rejeitados"
    if (status === "later") return "Rever depois"
    if (status === "sent_crm") return "Enviados CRM"
    if (status === "sent_radar") return "Enviados Radar"
    return status
  }

  const lead =
    currentLead()

  return (
    <div className="text-white space-y-6">
      <div>
        <h1 className="text-4xl font-bold">
          Captação de Leads IA
        </h1>

        <p className="text-slate-400 mt-2">
          Cole comentários, textos ou listas e transforme em leads qualificados.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={source}
            onChange={(e) =>
              setSource(e.target.value)
            }
            className="bg-slate-800 p-4 rounded-xl outline-none"
          >
            <option value="Instagram">
              Instagram
            </option>
            <option value="Facebook">
              Facebook
            </option>
            <option value="Marketplace">
              Marketplace
            </option>
            <option value="WhatsApp">
              WhatsApp
            </option>
            <option value="Manual">
              Manual
            </option>
          </select>

          <input
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
            placeholder="Cidade base. Ex: Unaí"
            className="bg-slate-800 p-4 rounded-xl outline-none md:col-span-2"
          />
        </div>

        <textarea
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          placeholder="Cole aqui comentários de post, texto do marketplace, lista copiada, conversas ou observações..."
          className="w-full bg-slate-800 p-4 rounded-xl outline-none min-h-40"
        />

        <button
          onClick={extractLeads}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {loading
            ? "Extraindo..."
            : "Extrair Leads com IA"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          "pending",
          "approved",
          "later",
          "rejected",
          "sent_crm",
          "sent_radar"
        ].map(status => (
          <button
            key={status}
            onClick={() =>
              setStatusFilter(status)
            }
            className={
              statusFilter === status
                ? "bg-red-600 p-3 rounded-xl font-bold"
                : "bg-slate-800 hover:bg-slate-700 p-3 rounded-xl font-bold"
            }
          >
            {statusLabel(status)}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Revisão de Leads
            </h2>

            <p className="text-slate-400 mt-1">
              {items.length
                ? `${currentIndex + 1} de ${items.length}`
                : "Nenhum lead nesta fila."}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={previousLead}
              disabled={currentIndex === 0}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-bold disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              onClick={nextLead}
              disabled={currentIndex >= items.length - 1}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-bold disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>

        {!lead && (
          <div className="text-center text-slate-500 py-20 border border-dashed border-slate-700 rounded-3xl">
            Nenhum lead para revisar nesta categoria.
          </div>
        )}

        {lead && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-950 border border-slate-800 rounded-[2rem] p-6 shadow-2xl">
              <div className="flex flex-wrap gap-3 mb-5">
                <span className="bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold">
                  {lead.source}
                </span>

                <span className={`px-4 py-2 rounded-xl text-sm font-bold ${scoreColor(lead.lead_score)}`}>
                  Score {lead.lead_score || 0}
                </span>

                {lead.professional_use && (
                  <span className="bg-green-600 px-4 py-2 rounded-xl text-sm font-bold">
                    Uso profissional
                  </span>
                )}
              </div>

              <h2 className="text-3xl font-black">
                {lead.name || "Lead sem nome"}
              </h2>

              <p className="text-slate-400 mt-2">
                {lead.city || "Cidade não informada"}
              </p>

              <div className="mt-6 space-y-4">
                <div className="bg-slate-900 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm font-bold">
                    Comentário / origem
                  </p>

                  <p className="text-slate-200 mt-2 whitespace-pre-line">
                    {lead.original_comment ||
                      lead.source_text ||
                      "Sem comentário original"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-2xl p-4">
                    <p className="text-slate-500 text-sm font-bold">
                      WhatsApp / Telefone
                    </p>

                    <p className="text-slate-200 mt-2">
                      {lead.phone || "Não informado"}
                    </p>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4">
                    <p className="text-slate-500 text-sm font-bold">
                      Instagram
                    </p>

                    <p className="text-slate-200 mt-2">
                      {lead.instagram || "Não informado"}
                    </p>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4">
                    <p className="text-slate-500 text-sm font-bold">
                      Interesse
                    </p>

                    <p className="text-slate-200 mt-2">
                      {lead.interest || "Não informado"}
                    </p>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4">
                    <p className="text-slate-500 text-sm font-bold">
                      Moto atual
                    </p>

                    <p className="text-slate-200 mt-2">
                      {lead.current_motorcycle || "Não informada"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-4">
                  <p className="text-slate-500 text-sm font-bold">
                    Motivo da IA
                  </p>

                  <p className="text-slate-300 mt-2">
                    {lead.reason || "Sem motivo informado"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                <button
                  onClick={() =>
                    updateLeadStatus(
                      lead.id,
                      "rejected"
                    )
                  }
                  className="bg-red-600 hover:bg-red-700 p-3 rounded-xl font-bold"
                >
                  Rejeitar
                </button>

                <button
                  onClick={() =>
                    updateLeadStatus(
                      lead.id,
                      "later"
                    )
                  }
                  className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded-xl font-bold text-black"
                >
                  Rever depois
                </button>

                <button
                  onClick={() =>
                    updateLeadStatus(
                      lead.id,
                      "approved"
                    )
                  }
                  className="bg-green-600 hover:bg-green-700 p-3 rounded-xl font-bold"
                >
                  Aprovar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <button
                  onClick={() =>
                    sendToCRM(lead)
                  }
                  disabled={
                    savingId === lead.id
                  }
                  className="bg-blue-600 hover:bg-blue-700 p-3 rounded-xl font-bold disabled:opacity-50"
                >
                  {savingId === lead.id
                    ? "Enviando..."
                    : "Enviar para CRM"}
                </button>

                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      lead.phone ||
                      lead.instagram ||
                      lead.name ||
                      ""
                    )
                  }
                  className="bg-slate-700 hover:bg-slate-600 p-3 rounded-xl font-bold"
                >
                  Copiar Contato
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}