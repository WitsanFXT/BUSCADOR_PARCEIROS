import {
  Phone,
  User,
  MessageSquare,
  Calendar,
  BadgeDollarSign,
  Pencil,
  Trash2,
  Flame,
  Gauge,
  Bike,
  MapPin
} from "lucide-react"

import {
  useEffect,
  useState
} from "react"

import api from "../services/api"

export default function CRM() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  const crmSearch =
    localStorage.getItem("crmSearch") || ""

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    try {
      const response = await api.get("/leads")

      const sortedLeads =
        (response.data || []).sort((a, b) =>
          (b.lead_score || 0) - (a.lead_score || 0)
        )

      setLeads(sortedLeads)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteLead(id) {
    const confirmDelete =
      window.confirm("Deseja excluir este lead?")

    if (!confirmDelete) return

    try {
      await api.delete(`/leads/${id}`)
      fetchLeads()
    } catch (error) {
      console.log(error)
    }
  }

  function clearFilter() {
    localStorage.removeItem("crmSearch")
    window.location.reload()
  }

  function getStatusColor(status) {
    switch (status) {
      case "Novo Lead":
        return "bg-blue-600"
      case "Negociando":
        return "bg-yellow-500"
      case "Parceiro":
        return "bg-green-600"
      case "Sem interesse":
        return "bg-red-600"
      default:
        return "bg-slate-600"
    }
  }

  function getTemperatureColor(temperature) {
    switch (temperature) {
      case "Quente":
        return "bg-red-600 text-white"
      case "Morno":
        return "bg-yellow-500 text-black"
      case "Frio":
        return "bg-blue-600 text-white"
      default:
        return "bg-slate-700 text-white"
    }
  }

  function getScoreColor(score) {
    if (score >= 70) return "text-red-400"
    if (score >= 40) return "text-yellow-400"
    return "text-blue-400"
  }

  const filteredLeads =
    leads.filter((lead) => {
      if (!crmSearch) return true

      return (
        lead.company_name
          ?.toLowerCase()
          .includes(crmSearch.toLowerCase())

        ||

        lead.city
          ?.toLowerCase()
          .includes(crmSearch.toLowerCase())

        ||

        lead.responsible
          ?.toLowerCase()
          .includes(crmSearch.toLowerCase())
      )
    })

  if (loading) {
    return (
      <div className="text-white">
        Carregando leads...
      </div>
    )
  }

  return (
    <div className="text-white">

      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          CRM de Parceiros
        </h1>

        <p className="text-slate-400 mt-2">
          Leads ordenados automaticamente pelo Score Inteligente
        </p>

        {crmSearch && (
          <div className="mt-5 flex items-center gap-3">
            <div className="bg-blue-600 px-4 py-2 rounded-xl">
              Filtro:
              <strong className="ml-2">
                {crmSearch}
              </strong>
            </div>

            <button
              onClick={clearFilter}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {!filteredLeads.length && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold">
            Nenhum lead encontrado
          </h2>

          <p className="text-slate-400 mt-3">
            Tente alterar sua pesquisa.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredLeads.map((lead) => {
          const score = lead.lead_score || 0
          const temperature =
            lead.lead_temperature || "Frio"

          return (
            <div
              key={lead.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
            >

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {lead.company_name}
                  </h2>

                  <div className="flex flex-wrap gap-3 mt-3">
                    <div
                      className={`px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(lead.status)}`}
                    >
                      {lead.status || "Sem status"}
                    </div>

                    <div
                      className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${getTemperatureColor(temperature)}`}
                    >
                      <Flame size={16} />
                      {temperature}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-4xl font-black ${getScoreColor(score)}`}>
                    {score}
                  </div>

                  <p className="text-slate-400 text-sm">
                    score
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3 text-slate-300">
                    <Gauge size={18} />
                    <span>Temperatura</span>
                  </div>

                  <strong className="block mt-2">
                    {temperature}
                  </strong>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3 text-slate-300">
                    <MapPin size={18} />
                    <span>Origem</span>
                  </div>

                  <strong className="block mt-2">
                    {lead.lead_source || "Não informada"}
                  </strong>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <User size={18} />
                  <span>
                    {lead.responsible || "Não informado"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} />
                  <span>
                    {lead.whatsapp || lead.phone || "Sem telefone"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar size={18} />
                  <span>
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleDateString("pt-BR")
                      : "-"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <BadgeDollarSign size={18} />
                  <span>
                    {lead.interest || "Sem interesse informado"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Bike size={18} />
                  <span>
                    {lead.current_motorcycle
                      ? `${lead.current_motorcycle}${lead.motorcycle_year ? ` • ${lead.motorcycle_year}` : ""}${lead.mileage ? ` • ${lead.mileage} km` : ""}`
                      : "Moto atual não informada"}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare size={18} />
                  <span>
                    {lead.notes || "Sem observações"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
                <a
                  href={`https://wa.me/55${lead.whatsapp || lead.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-600 hover:bg-green-700 transition p-3 rounded-xl font-bold text-center"
                >
                  WhatsApp
                </a>

                <button className="bg-blue-600 hover:bg-blue-700 transition p-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Pencil size={18} />
                  Editar
                </button>

                <button
                  onClick={() => deleteLead(lead.id)}
                  className="bg-red-600 hover:bg-red-700 transition p-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Excluir
                </button>

                <button className="bg-slate-700 hover:bg-slate-600 transition p-3 rounded-xl font-bold">
                  {lead.priority || "Normal"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}