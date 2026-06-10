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

import { useEffect, useMemo, useState } from "react"

import api from "../services/api"
import NewLeadModal from "../components/NewLeadModal"
import Toast from "../components/Toast"
import ConfirmModal from "../components/ConfirmModal"

export default function CRM() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [toast, setToast] = useState(null)
  const [leadToDelete, setLeadToDelete] = useState(null)
  const [search, setSearch] = useState(localStorage.getItem("crmSearch") || "")
  const [filter, setFilter] = useState("Todos")
  const [scheduleLead, setScheduleLead] = useState(null)
  const [actionsModalLead, setActionsModalLead] = useState(null)
  const [leadActions, setLeadActions] = useState([])
  const [loadingActions, setLoadingActions] = useState(false)

  const [scheduleForm, setScheduleForm] = useState({
    days: "3",
    notes: "Retornar contato e verificar interesse."
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  function showToast(type, title, message = "") {
    setToast({ type, title, message })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchLeads() {
    try {
      setLoading(true)

      const response = await api.get("/leads")

      const sortedLeads = (response.data || []).sort(
        (a, b) => (b.lead_score || 0) - (a.lead_score || 0)
      )

      setLeads(sortedLeads)
    } catch (error) {
      console.log(error)

      showToast(
        "error",
        "Erro ao carregar CRM",
        "Não foi possível carregar os leads."
      )
    } finally {
      setLoading(false)
    }
  }

  async function deleteLead(id) {
    try {
      await api.delete(`/leads/${id}`)

      showToast(
        "success",
        "Lead excluído",
        "O lead foi removido do CRM com sucesso."
      )

      setLeadToDelete(null)
      fetchLeads()
    } catch (error) {
      console.log(error)

      showToast(
        "error",
        "Erro ao excluir",
        "Não foi possível remover este lead."
      )
    }
  }

  function updateSearch(value) {
    setSearch(value)

    if (value) {
      localStorage.setItem("crmSearch", value)
    } else {
      localStorage.removeItem("crmSearch")
    }
  }

  function clearFilters() {
    setSearch("")
    setFilter("Todos")
    localStorage.removeItem("crmSearch")
  }

  function cleanPhone(phone) {
    return String(phone || "").replace(/\D/g, "")
  }

  function finalPhone(phone) {
    const cleaned = cleanPhone(phone)
    if (!cleaned) return ""
    return cleaned.startsWith("55") ? cleaned : `55${cleaned}`
  }

  function addDays(days) {
    const date = new Date()
    date.setDate(date.getDate() + Number(days || 0))
    return date.toISOString().split("T")[0]
  }

  function openWhatsApp(lead) {
    const phone = finalPhone(lead.whatsapp || lead.phone)

    if (!phone) {
      showToast(
        "warning",
        "Sem WhatsApp",
        "Este lead não possui telefone cadastrado."
      )
      return
    }

    

    const message = `Olá, ${lead.responsible || lead.company_name || "tudo bem"}! Sou consultor Yamaha. Queria verificar se ainda faz sentido avaliarmos uma condição para sua próxima moto.`

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    )
  }

  function openInstagram(lead) {
    const instagram = String(lead.instagram || "").replace("@", "").trim()

    if (!instagram) {
      showToast(
        "warning",
        "Sem Instagram",
        "Este lead não possui Instagram cadastrado."
      )
      return
    }

    window.open(`https://instagram.com/${instagram}`, "_blank")
  }

  function openScheduleModal(lead) {
    setScheduleLead(lead)

    setScheduleForm({
      days: "3",
      notes: `Retornar contato com ${lead.company_name || "cliente"} e verificar interesse.`
    })
  }

  async function loadLeadActions(lead) {
  try {
    setActionsModalLead(lead)
    setLoadingActions(true)

    const response =
      await api.get(`/assistant/lead-actions/${lead.id}`)

    setLeadActions(response.data || [])
  } catch (err) {
    console.log(err)

    showToast(
      "error",
      "Erro ao carregar histórico",
      "Não foi possível carregar as mensagens IA deste lead."
    )
  } finally {
    setLoadingActions(false)
  }
}

  async function scheduleFollowup() {
    if (!scheduleLead) return

    const daysNumber = Number(scheduleForm.days)

    if (!daysNumber || daysNumber < 1) {
      showToast(
        "warning",
        "Data inválida",
        "Informe um número de dias maior que zero."
      )
      return
    }

    try {
      await api.post("/agenda/followups", {
        lead_id: scheduleLead.id,
        opportunity_id: null,
        title: scheduleLead.company_name,
        contact_name: scheduleLead.company_name,
        phone: scheduleLead.whatsapp || scheduleLead.phone || "",
        source: "CRM",
        next_contact_date: addDays(daysNumber),
        notes: scheduleForm.notes || "Retornar contato."
      })

      showToast(
        "success",
        "Retorno agendado",
        "O follow-up foi enviado para a Agenda."
      )

      setScheduleLead(null)
    } catch (error) {
      console.log(error)

      showToast(
        "error",
        "Erro ao agendar",
        "Não foi possível agendar o retorno."
      )
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case "Novo Lead":
        return "bg-blue-600"
      case "Negociando":
        return "bg-yellow-500 text-black"
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

  function matchesFilter(lead) {
    const temperature = lead.lead_temperature || "Frio"
    const status = lead.status || ""

    if (filter === "Todos") return true
    if (filter === "Quentes") return temperature === "Quente"
    if (filter === "Mornos") return temperature === "Morno"
    if (filter === "Frios") return temperature === "Frio"
    if (filter === "Negociando") return status === "Negociando"
    if (filter === "Parceiros") return status === "Parceiro"

    return true
  }

  const metrics = useMemo(() => {
    return {
      total: leads.length,
      hot: leads.filter(lead => lead.lead_temperature === "Quente").length,
      negotiating: leads.filter(lead => lead.status === "Negociando").length,
      partners: leads.filter(lead => lead.status === "Parceiro").length,
      noInterest: leads.filter(lead => lead.status === "Sem interesse").length
    }
  }, [leads])

  const filteredLeads = useMemo(() => {
    const term = search.toLowerCase().trim()

    return leads.filter(lead => {
      const matchesSearch =
        !term ||
        String(lead.company_name || "").toLowerCase().includes(term) ||
        String(lead.city || "").toLowerCase().includes(term) ||
        String(lead.responsible || "").toLowerCase().includes(term) ||
        String(lead.whatsapp || lead.phone || "").toLowerCase().includes(term) ||
        String(lead.lead_source || "").toLowerCase().includes(term) ||
        String(lead.current_motorcycle || "").toLowerCase().includes(term)

      return matchesSearch && matchesFilter(lead)
    })
  }, [leads, search, filter])

  if (loading) {
    return (
      <div className="text-white">
        Carregando leads...
      </div>
    )
  }

  return (
    <div className="text-white space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">
            CRM Inteligente
          </h1>

          <p className="text-slate-400 mt-2">
            Leads ordenados pelo Score IA, com filtros comerciais e ações rápidas.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingLead(null)
            setShowModal(true)
          }}
          className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          +
          Novo Lead
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <p className="text-slate-400 text-sm">Total</p>
          <h2 className="text-4xl font-bold mt-2">{metrics.total}</h2>
        </div>

        <div className="bg-red-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">Quentes</p>
          <h2 className="text-4xl font-bold mt-2">{metrics.hot}</h2>
        </div>

        <div className="bg-yellow-500 text-black rounded-3xl p-5">
          <p className="text-sm opacity-80">Negociando</p>
          <h2 className="text-4xl font-bold mt-2">{metrics.negotiating}</h2>
        </div>

        <div className="bg-green-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">Parceiros</p>
          <h2 className="text-4xl font-bold mt-2">{metrics.partners}</h2>
        </div>

        <div className="bg-blue-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">Sem interesse</p>
          <h2 className="text-4xl font-bold mt-2">{metrics.noInterest}</h2>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="relative">
          

          <input
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Buscar por nome, cidade, responsável, telefone, origem ou moto..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            "Todos",
            "Quentes",
            "Mornos",
            "Frios",
            "Negociando",
            "Parceiros"
          ].map(option => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-4 py-2 rounded-xl font-bold ${
                filter === option
                  ? "bg-blue-600"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {option}
            </button>
          ))}

          {(search || filter !== "Todos") && (
            <button
              onClick={clearFilters}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {!filteredLeads.length && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold">
            Nenhum lead encontrado
          </h2>

          <p className="text-slate-400 mt-3">
            Tente alterar sua pesquisa ou limpar os filtros.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredLeads.map((lead) => {
          const score = lead.lead_score || 0
          const temperature = lead.lead_temperature || "Frio"
          const phone = lead.whatsapp || lead.phone || ""

          return (
            <div
              key={lead.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold break-words">
                    {lead.company_name || "Lead sem nome"}
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

                <div className="text-right shrink-0">
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
                  <span>{lead.responsible || "Não informado"}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} />
                  <span>{phone || "Sem telefone"}</span>
                </div>

                {lead.instagram && (
                  <button
                    onClick={() => openInstagram(lead)}
                    className="flex items-center gap-3 text-pink-400 hover:text-pink-300"
                  >
                    📸
                    <span>@{String(lead.instagram).replace("@", "")}</span>
                  </button>
                )}

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
                  <span>{lead.interest || "Sem interesse informado"}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Bike size={18} />
                  <span>
                    {lead.current_motorcycle
                      ? `${lead.current_motorcycle}${
                          lead.motorcycle_year ? ` • ${lead.motorcycle_year}` : ""
                        }${lead.mileage ? ` • ${lead.mileage} km` : ""}`
                      : "Moto atual não informada"}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <MessageSquare size={18} />
                  <span>{lead.notes || "Sem observações"}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mt-8">
                <button
                  onClick={() => openWhatsApp(lead)}
                  className="bg-green-600 hover:bg-green-700 transition p-3 rounded-xl font-bold text-center"
                >
                  WhatsApp
                </button>

                <button
                  onClick={() => openScheduleModal(lead)}
                  className="bg-yellow-500 hover:bg-yellow-600 transition p-3 rounded-xl font-bold text-black flex items-center justify-center gap-2"
                >
                  📅
                  Retorno
                </button>

                <button
                  onClick={() => {
                    setEditingLead(lead)
                    setShowModal(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 transition p-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Pencil size={18} />
                  Editar
                </button>

                <button
  onClick={() => loadLeadActions(lead)}
  className="bg-slate-700 hover:bg-slate-600 transition p-3 rounded-xl font-bold"
>
  Histórico IA
</button>

                <button
                  onClick={() => openInstagram(lead)}
                  className="bg-pink-600 hover:bg-pink-700 transition p-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  📸
                  Insta
                </button>

                <button
                  onClick={() => setLeadToDelete(lead)}
                  className="bg-red-600 hover:bg-red-700 transition p-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Excluir
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {scheduleLead && (
        <div className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold">
              Agendar retorno
            </h2>

            <p className="text-slate-400 mt-2 break-words">
              {scheduleLead.company_name}
            </p>

            <div className="grid grid-cols-3 gap-3 mt-5">
              {["1", "3", "7"].map(day => (
                <button
                  key={day}
                  onClick={() =>
                    setScheduleForm({
                      ...scheduleForm,
                      days: day
                    })
                  }
                  className={`p-3 rounded-xl font-bold ${
                    scheduleForm.days === day
                      ? "bg-yellow-500 text-black"
                      : "bg-slate-800"
                  }`}
                >
                  {day} dia{day === "1" ? "" : "s"}
                </button>
              ))}
            </div>

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
                onClick={() => setScheduleLead(null)}
                className="bg-slate-700 hover:bg-slate-600 p-3 rounded-xl font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={scheduleFollowup}
                className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded-xl font-bold text-black"
              >
                Agendar retorno
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />

      <ConfirmModal
        open={!!leadToDelete}
        title="Excluir lead"
        message={`Deseja realmente excluir ${
          leadToDelete?.company_name || "este lead"
        }? Essa ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onCancel={() => setLeadToDelete(null)}
        onConfirm={() => deleteLead(leadToDelete.id)}
      />

      {actionsModalLead && (
  <div className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center px-4">
    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-3xl max-h-[80vh] overflow-auto">
      <h2 className="text-2xl font-bold">
        Histórico IA
      </h2>

      <p className="text-slate-400 mt-2">
        {actionsModalLead.company_name}
      </p>

      <div className="mt-6 space-y-4">
        {loadingActions && (
          <p className="text-slate-400">
            Carregando histórico...
          </p>
        )}

        {!loadingActions && leadActions.length === 0 && (
          <p className="text-slate-400">
            Nenhuma mensagem IA gerada para este lead ainda.
          </p>
        )}

        {leadActions.map(action => (
          <div
            key={action.id}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-4"
          >
            <p className="text-sm text-slate-500 font-bold">
              {action.action_title || action.action_type}
            </p>

            <p className="text-slate-200 mt-3 whitespace-pre-line">
              {action.message}
            </p>

            <p className="text-xs text-slate-500 mt-3">
              {new Date(action.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setActionsModalLead(null)
          setLeadActions([])
        }}
        className="mt-6 bg-slate-700 hover:bg-slate-600 px-5 py-3 rounded-xl font-bold"
      >
        Fechar
      </button>
    </div>
  </div>
)}

      <NewLeadModal
        open={showModal}
        leadToEdit={editingLead}
        onClose={() => {
          setShowModal(false)
          setEditingLead(null)
        }}
        onSuccess={() => {
          fetchLeads()
          setShowModal(false)
          setEditingLead(null)
        }}
      />
    </div>
  )
}