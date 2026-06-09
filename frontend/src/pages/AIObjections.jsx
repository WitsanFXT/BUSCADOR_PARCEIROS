import { useEffect, useState } from "react"
import api from "../services/api"

export default function AIObjections() {
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState("")
  const [objection, setObjection] = useState("")
  const [result, setResult] = useState(null)
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

  async function generateObjectionResponse() {
    if (!objection.trim()) {
      alert("Digite a objeção do cliente.")
      return
    }

    try {
      setLoading(true)
      setResult(null)

      const response =
        await api.post("/assistant/generate", {
          objective: "objection",
          lead_id: selectedLead || null,
          extra: {
            objection
          }
        })

      setResult(response.data)
    } catch (err) {
      console.log(err)
      alert("Erro ao gerar resposta para objeção.")
    } finally {
      setLoading(false)
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text || "")
    alert("Texto copiado!")
  }

  function cleanPhone(phone) {
    return String(phone || "").replace(/\D/g, "")
  }

  function getSelectedLead() {
    return leads.find(
      lead => String(lead.id) === String(selectedLead)
    )
  }

  function openWhatsApp(message) {
    const lead = getSelectedLead()

    if (!lead) {
      alert("Selecione um lead para abrir o WhatsApp.")
      return
    }

    const phone =
      cleanPhone(lead.whatsapp || lead.phone)

    if (!phone) {
      alert("Este lead não possui telefone.")
      return
    }

    window.open(
      `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    )
  }

  const commonObjections = [
    "Achei caro",
    "Vou pensar",
    "Não tenho entrada",
    "Vou esperar mais um pouco",
    "Estou vendo Honda também",
    "Minha moto ainda está boa",
    "A parcela ficou alta",
    "Tenho medo de não aprovar"
  ]

  return (
    <div className="text-white space-y-6">
      <div>
        <h1 className="text-4xl font-bold">
          IA de Objeções
        </h1>

        <p className="text-slate-400 mt-2">
          Gere respostas comerciais para quando o cliente travar na negociação.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <select
          value={selectedLead}
          onChange={(e) =>
            setSelectedLead(e.target.value)
          }
          className="w-full bg-slate-800 p-4 rounded-xl outline-none"
        >
          <option value="">
            Sem lead específico
          </option>

          {leads.map((lead) => (
            <option
              key={lead.id}
              value={lead.id}
            >
              {lead.company_name}
              {lead.lead_score
                ? ` • Score ${lead.lead_score}`
                : ""}
            </option>
          ))}
        </select>

        <textarea
          value={objection}
          onChange={(e) =>
            setObjection(e.target.value)
          }
          placeholder="Digite a objeção do cliente. Ex: Achei caro, vou pensar, não tenho entrada..."
          className="w-full bg-slate-800 p-4 rounded-xl outline-none min-h-28"
        />

        <div className="flex flex-wrap gap-3">
          {commonObjections.map((item) => (
            <button
              key={item}
              onClick={() => setObjection(item)}
              className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold"
            >
              {item}
            </button>
          ))}
        </div>

        <button
          onClick={generateObjectionResponse}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {loading
            ? "Gerando..."
            : "Gerar resposta com IA"}
        </button>
      </div>

      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-2xl font-bold">
            {result.title}
          </h2>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-sm font-bold mb-2">
              Melhor resposta
            </p>

            <p className="text-slate-200 whitespace-pre-line">
              {result.message}
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => copyText(result.message)}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-bold"
              >
                Copiar
              </button>

              <button
                onClick={() => openWhatsApp(result.message)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-bold"
              >
                Enviar no WhatsApp
              </button>
            </div>
          </div>

          {result.variations?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {result.variations.map((variation, index) => (
                <div
                  key={index}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4"
                >
                  <p className="text-slate-400 text-sm font-bold mb-2">
                    Variação {index + 1}
                  </p>

                  <p className="text-slate-200 whitespace-pre-line">
                    {variation}
                  </p>

                  <button
                    onClick={() => copyText(variation)}
                    className="mt-4 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-bold"
                  >
                    Copiar
                  </button>
                </div>
              ))}
            </div>
          )}

          {result.best_use && (
            <div className="text-slate-400 text-sm">
              <strong>Melhor uso:</strong> {result.best_use}
            </div>
          )}

          {result.reason && (
            <div className="text-slate-500 text-sm">
              {result.reason}
            </div>
          )}
        </div>
      )}
    </div>
  )
}