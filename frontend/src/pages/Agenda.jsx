import { useEffect, useMemo, useState } from "react"
import api from "../services/api"

export default function Agenda() {
  const [priorities, setPriorities] = useState([])
  const [followups, setFollowups] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("today")
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState(null)
  const [scheduleItem, setScheduleItem] = useState(null)

  const [scheduleForm, setScheduleForm] = useState({
    days: "3",
    notes: "Retornar contato e verificar interesse."
  })

  useEffect(() => {
    loadData()
  }, [])

  function showToast(type, title, message = "") {
    setToast({ type, title, message })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadData() {
    try {
      setLoading(true)

      const [prioritiesResponse, followupsResponse] = await Promise.all([
        api.get("/agenda/priorities"),
        api.get("/agenda/followups")
      ])

      setPriorities(prioritiesResponse.data || [])
      setFollowups(followupsResponse.data || [])
    } catch (err) {
      console.log(err)
      showToast("error", "Erro ao carregar agenda", "Não foi possível buscar os dados.")
    } finally {
      setLoading(false)
    }
  }

  function today() {
    return new Date().toISOString().split("T")[0]
  }

  function addDays(days) {
    const date = new Date()
    date.setDate(date.getDate() + Number(days || 0))
    return date.toISOString().split("T")[0]
  }

  function formatDate(date) {
    if (!date) return "Sem data"
    return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR")
  }

  function isOverdue(date) {
    return date < today()
  }

  function isToday(date) {
    return date === today()
  }

  function cleanPhone(phone) {
    return String(phone || "").replace(/\D/g, "")
  }

  function finalPhone(phone) {
    const cleaned = cleanPhone(phone)
    if (!cleaned) return ""
    return cleaned.startsWith("55") ? cleaned : `55${cleaned}`
  }

  function getColor(score) {
    if ((score || 0) >= 80) return "bg-red-600"
    if ((score || 0) >= 40) return "bg-yellow-500 text-black"
    return "bg-blue-600"
  }

  function generateMessage(item) {
    const name = item.title || item.contact_name || "tudo bem"

    if (item.type === "followup") {
      return `Olá, ${name}. Passando para retomar nosso contato. Você ainda tem interesse em analisar uma condição para sua moto Yamaha?`
    }

    if (item.type === "opportunity") {
      return `Olá, ${name}. Vi uma oportunidade de conversar com você sobre uma moto Yamaha para sua rotina. Posso fazer uma simulação sem compromisso?`
    }

    return `Olá, ${name}. Sou consultor Yamaha e queria entender se ainda faz sentido avaliarmos uma condição para sua próxima moto.`
  }

  async function copyMessage(item) {
    try {
      await navigator.clipboard.writeText(generateMessage(item))
      showToast("success", "Mensagem copiada", "A abordagem foi copiada.")
    } catch {
      showToast("error", "Erro ao copiar", "Não foi possível copiar a mensagem.")
    }
  }

  function openWhatsApp(item) {
    const phone = finalPhone(item.phone)

    if (!phone) {
      showToast("warning", "Sem WhatsApp", "Este contato não possui telefone.")
      return
    }

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(generateMessage(item))}`,
      "_blank"
    )
  }

  function openScheduleModal(item) {
    setScheduleItem(item)
    setScheduleForm({
      days: "3",
      notes: `Retornar contato com ${item.title || item.contact_name || "cliente"} e verificar interesse.`
    })
  }

  async function scheduleFollowup() {
    if (!scheduleItem) return

    const daysNumber = Number(scheduleForm.days)

    if (!daysNumber || daysNumber < 1) {
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
        title: scheduleItem.title || scheduleItem.contact_name,
        contact_name: scheduleItem.title || scheduleItem.contact_name,
        phone: scheduleItem.phone || "",
        source: scheduleItem.source || scheduleItem.type || "Agenda",
        next_contact_date: addDays(daysNumber),
        notes: scheduleForm.notes || "Retornar contato."
      })

      showToast("success", "Follow-up agendado", "O retorno foi salvo na agenda.")
      setScheduleItem(null)
      loadData()
    } catch (err) {
      console.log(err)
      showToast("error", "Erro ao agendar", "Não foi possível criar o follow-up.")
    }
  }

  async function markDone(id) {
    try {
      await api.put(`/agenda/followups/${id}/done`)
      showToast("success", "Follow-up concluído", "O retorno foi marcado como concluído.")
      loadData()
    } catch (err) {
      console.log(err)
      showToast("error", "Erro ao concluir", "Não foi possível concluir o follow-up.")
    }
  }

  const pending = useMemo(() => {
    return followups.filter(item => item.status === "Pendente")
  }, [followups])

  const done = useMemo(() => {
    return followups.filter(item => item.status === "Concluído")
  }, [followups])

  const dueToday = useMemo(() => {
    return pending.filter(item => item.next_contact_date <= today())
  }, [pending])

  const overdue = useMemo(() => {
    return pending.filter(item => isOverdue(item.next_contact_date))
  }, [pending])

  const upcoming = useMemo(() => {
    return pending.filter(item => item.next_contact_date > today())
  }, [pending])

  const filteredFollowups = useMemo(() => {
    let list = []

    if (activeTab === "today") list = dueToday
    if (activeTab === "upcoming") list = upcoming
    if (activeTab === "done") list = done

    if (!search.trim()) return list

    const term = search.toLowerCase()

    return list.filter(item =>
      String(item.contact_name || item.title || "").toLowerCase().includes(term) ||
      String(item.phone || "").toLowerCase().includes(term) ||
      String(item.notes || "").toLowerCase().includes(term)
    )
  }, [activeTab, dueToday, upcoming, done, search])

  const topPriority = priorities[0]

  const toastColors = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-600 text-white"
  }

  function PriorityCard({ item, featured = false, index = 0 }) {
    return (
      <div className={`${featured ? "bg-slate-900 border border-red-600" : "bg-slate-800"} rounded-3xl p-5`}>
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              {featured && (
                <span className="bg-red-600 px-3 py-1 rounded-xl text-xs font-bold">
                  Prioridade máxima
                </span>
              )}

              {!featured && (
                <span className="bg-slate-700 px-3 py-1 rounded-xl text-xs font-bold">
                  #{index + 1}
                </span>
              )}

              <span className={`${getColor(item.score)} px-3 py-1 rounded-xl text-xs font-bold`}>
                Score {item.score || 0}
              </span>

              <span className="bg-blue-600 px-3 py-1 rounded-xl text-xs font-bold">
                {item.probability || 0}% chance
              </span>

              <span className="bg-slate-700 px-3 py-1 rounded-xl text-xs font-bold">
                {item.type || "contato"}
              </span>
            </div>

            <h2 className={`${featured ? "text-3xl" : "text-xl"} font-bold break-words`}>
              {item.title || "Contato sem nome"}
            </h2>

            <p className="text-slate-400 mt-2 break-words whitespace-pre-line">
              {item.reason || "Sem observação."}
            </p>

            <div className="mt-4 bg-slate-950 border border-slate-700 rounded-2xl p-4">
              <p className="text-sm text-slate-400 font-bold mb-2">
                Próxima ação sugerida
              </p>
              <p className="text-slate-200">
                {item.type === "followup"
                  ? "Retomar contato hoje e registrar o resultado."
                  : "Enviar abordagem comercial e agendar próximo retorno."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3 w-full xl:w-48 shrink-0">
            <button
              onClick={() => openWhatsApp(item)}
              className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-bold"
            >
              WhatsApp
            </button>

            <button
              onClick={() => copyMessage(item)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-bold"
            >
              Copiar msg
            </button>

            <button
              onClick={() => openScheduleModal(item)}
              className="bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-xl font-bold text-black"
            >
              Agendar
            </button>
          </div>
        </div>
      </div>
    )
  }

  function FollowupCard({ item }) {
    const name = item.contact_name || item.title || "Contato sem nome"
    const overdueItem = isOverdue(item.next_contact_date)
    const todayItem = isToday(item.next_contact_date)

    return (
      <div className="bg-slate-800 rounded-3xl p-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              {overdueItem && (
                <span className="bg-red-600 px-3 py-1 rounded-xl text-xs font-bold">
                  Atrasado
                </span>
              )}

              {todayItem && (
                <span className="bg-green-600 px-3 py-1 rounded-xl text-xs font-bold">
                  Hoje
                </span>
              )}

              {!overdueItem && !todayItem && (
                <span className="bg-blue-600 px-3 py-1 rounded-xl text-xs font-bold">
                  Próximo
                </span>
              )}

              <span className="bg-slate-700 px-3 py-1 rounded-xl text-xs font-bold">
                {formatDate(item.next_contact_date)}
              </span>
            </div>

            <h3 className="text-xl font-bold break-words">
              {name}
            </h3>

            <p className="text-slate-400 mt-2 break-words">
              {item.phone || "Sem telefone"}
            </p>

            <p className="text-slate-500 text-sm mt-2 break-words whitespace-pre-line">
              {item.notes || "Sem observação."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3 w-full xl:w-48 shrink-0">
            <button
              onClick={() => openWhatsApp({
                ...item,
                title: name,
                type: "followup"
              })}
              className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-bold"
            >
              WhatsApp
            </button>

            <button
              onClick={() => copyMessage({
                ...item,
                title: name,
                type: "followup"
              })}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-bold"
            >
              Copiar msg
            </button>

            {item.status === "Pendente" && (
              <button
                onClick={() => markDone(item.id)}
                className="bg-emerald-600 hover:bg-emerald-700 px-4 py-3 rounded-xl font-bold"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="text-white">Carregando agenda...</div>
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">
            Agenda Inteligente
          </h1>
          <p className="text-slate-400 mt-2">
            Priorize contatos, execute follow-ups e mantenha sua rotina comercial organizada.
          </p>
        </div>

        <button
          onClick={loadData}
          className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl font-bold"
        >
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">Atrasados</p>
          <h2 className="text-4xl font-bold mt-2">{overdue.length}</h2>
        </div>

        <div className="bg-green-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">Hoje</p>
          <h2 className="text-4xl font-bold mt-2">{dueToday.length}</h2>
        </div>

        <div className="bg-blue-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">Próximos</p>
          <h2 className="text-4xl font-bold mt-2">{upcoming.length}</h2>
        </div>

        <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700">
          <p className="text-sm text-slate-400">Prioridades IA</p>
          <h2 className="text-4xl font-bold mt-2">{priorities.length}</h2>
        </div>
      </div>

      {topPriority && (
        <PriorityCard item={topPriority} featured />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-2xl font-bold mb-2">
          Plano Comercial de Hoje
        </h2>

        <p className="text-slate-400 mb-5">
          Comece pelos atrasados, depois execute os contatos com maior chance de fechamento.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-sm">1º passo</p>
            <p className="font-bold mt-1">Resolver {overdue.length} atrasado(s)</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-sm">2º passo</p>
            <p className="font-bold mt-1">Fazer {dueToday.length} retorno(s) de hoje</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-sm">3º passo</p>
            <p className="font-bold mt-1">Atacar top {Math.min(priorities.length, 5)} prioridade(s)</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <h2 className="text-2xl font-bold">
            Follow-ups
          </h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou observação..."
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none w-full xl:w-96"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <button
            onClick={() => setActiveTab("today")}
            className={`${activeTab === "today" ? "bg-green-600" : "bg-slate-800"} px-4 py-3 rounded-xl font-bold`}
          >
            Hoje/Atrasados
          </button>

          <button
            onClick={() => setActiveTab("upcoming")}
            className={`${activeTab === "upcoming" ? "bg-blue-600" : "bg-slate-800"} px-4 py-3 rounded-xl font-bold`}
          >
            Próximos
          </button>

          <button
            onClick={() => setActiveTab("done")}
            className={`${activeTab === "done" ? "bg-slate-600" : "bg-slate-800"} px-4 py-3 rounded-xl font-bold`}
          >
            Concluídos
          </button>
        </div>

        <div className="space-y-4">
          {filteredFollowups.map(item => (
            <FollowupCard key={item.id} item={item} />
          ))}

          {filteredFollowups.length === 0 && (
            <div className="text-center text-slate-400 py-10">
              Nenhum follow-up encontrado nesta visão.
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-2xl font-bold mb-5">
          Prioridades IA
        </h2>

        <div className="space-y-4">
          {priorities.slice(0, 10).map((item, index) => (
            <PriorityCard
              key={`${item.type}-${item.id}`}
              item={item}
              index={index}
            />
          ))}

          {priorities.length === 0 && (
            <div className="text-center text-slate-400 py-10">
              Nenhuma prioridade encontrada.
            </div>
          )}
        </div>
      </div>

      {scheduleItem && (
        <div className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold">
              Agendar retorno
            </h2>

            <p className="text-slate-400 mt-2 break-words">
              {scheduleItem.title || scheduleItem.contact_name}
            </p>

            <div className="grid grid-cols-3 gap-3 mt-5">
              {["1", "3", "7"].map(day => (
                <button
                  key={day}
                  onClick={() => setScheduleForm({ ...scheduleForm, days: day })}
                  className={`${scheduleForm.days === day ? "bg-yellow-500 text-black" : "bg-slate-800"} p-3 rounded-xl font-bold`}
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
                onClick={() => setScheduleItem(null)}
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

      {toast && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className={`${toastColors[toast.type] || toastColors.info} px-6 py-4 rounded-2xl shadow-2xl max-w-sm`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold">
                  {toast.title}
                </h3>

                {toast.message && (
                  <p className="text-sm mt-1 opacity-90">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => setToast(null)}
                className="font-bold"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}