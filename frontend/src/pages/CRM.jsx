import {
  Phone,
  User,
  MessageSquare,
  Calendar,
  BadgeDollarSign,
  Pencil,
  Trash2
} from "lucide-react"

import {
  useEffect,
  useState
} from "react"

import api from "../services/api"

export default function CRM() {

  const [leads, setLeads] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const crmSearch =
    localStorage.getItem("crmSearch") || ""

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {

    try {

      const response =
        await api.get("/leads")

      setLeads(response.data)

    } catch (error) {

      console.log(error)

    } finally {

      setLoading(false)

    }

  }

  async function deleteLead(id) {

    const confirmDelete =
      window.confirm(
        "Deseja excluir este lead?"
      )

    if (!confirmDelete) return

    try {

      await api.delete(`/leads/${id}`)

      fetchLeads()

    } catch (error) {

      console.log(error)

    }

  }

  function clearFilter() {

    localStorage.removeItem(
      "crmSearch"
    )

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

  const filteredLeads =
    leads.filter((lead) => {

      if (!crmSearch)
        return true

      return (

        lead.company_name
          ?.toLowerCase()
          .includes(
            crmSearch.toLowerCase()
          )

        ||

        lead.city
          ?.toLowerCase()
          .includes(
            crmSearch.toLowerCase()
          )

        ||

        lead.responsible
          ?.toLowerCase()
          .includes(
            crmSearch.toLowerCase()
          )

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

      {/* TOPO */}
      <div className="mb-10">

        <h1 className="text-4xl font-bold">
          CRM de Parceiros
        </h1>

        <p className="text-slate-400 mt-2">
          Gerencie contatos, negociações e parceiros ativos
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

      {/* SEM RESULTADO */}
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

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {filteredLeads.map((lead) => (

          <div
            key={lead.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
          >

            {/* TOPO */}
            <div className="flex items-start justify-between gap-4">

              <div>

                <h2 className="text-2xl font-bold">
                  {lead.company_name}
                </h2>

                <div
                  className={`inline-block mt-3 px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(lead.status)}`}
                >
                  {lead.status}
                </div>

              </div>

            </div>

            {/* DADOS */}
            <div className="mt-6 space-y-4">

              <div className="flex items-center gap-3">

                <User size={18} />

                <span>
                  {lead.responsible ||
                    "Não informado"}
                </span>

              </div>

              <div className="flex items-center gap-3">

                <Phone size={18} />

                <span>
                  {lead.phone ||
                    "Sem telefone"}
                </span>

              </div>

              <div className="flex items-center gap-3">

                <Calendar size={18} />

                <span>

                  {lead.created_at
                    ? new Date(
                        lead.created_at
                      ).toLocaleDateString(
                        "pt-BR"
                      )
                    : "-"}

                </span>

              </div>

              <div className="flex items-center gap-3">

                <BadgeDollarSign
                  size={18}
                />

                <span>
                  {lead.interest ||
                    "Sem interesse informado"}
                </span>

              </div>

              <div className="flex items-start gap-3">

                <MessageSquare
                  size={18}
                />

                <span>
                  {lead.notes ||
                    "Sem observações"}
                </span>

              </div>

            </div>

            {/* BOTÕES */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">

              <a
                href={`https://wa.me/55${lead.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 hover:bg-green-700 transition p-3 rounded-xl font-bold text-center"
              >
                WhatsApp
              </a>

              <button
                className="bg-blue-600 hover:bg-blue-700 transition p-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >

                <Pencil size={18} />

                Editar

              </button>

              <button
                onClick={() =>
                  deleteLead(lead.id)
                }
                className="bg-red-600 hover:bg-red-700 transition p-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >

                <Trash2 size={18} />

                Excluir

              </button>

              <button
                className="bg-slate-700 hover:bg-slate-600 transition p-3 rounded-xl font-bold"
              >
                {lead.priority ||
                  "Normal"}
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  )

}