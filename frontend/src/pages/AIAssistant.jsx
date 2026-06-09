import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

export default function AIAssistant() {
  const [assistant, setAssistant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [coach, setCoach] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    loadAssistant()
  }, [])

  async function loadAssistant() {
    try {
      const [
  homeResponse,
  coachResponse
] =
  await Promise.all([
    api.get("/assistant/home"),
    api.get("/assistant/coach")
  ])

setAssistant(homeResponse.data)
setCoach(coachResponse.data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  function urgencyColor(level) {
    if (level === "CRITICO") return "bg-red-600"
    if (level === "ATENCAO") return "bg-yellow-500 text-black"
    return "bg-green-600"
  }

  function priorityColor(priority) {
    if (priority <= 2) return "bg-red-600"
    if (priority <= 5) return "bg-yellow-500 text-black"
    return "bg-slate-700"
  }

  function metric(value) {
    return value ?? 0
  }

  if (loading) {
    return (
      <div className="text-white">
        Carregando Assistente IA...
      </div>
    )
  }

  const metrics =
    assistant?.metrics || {}

  return (
    <div className="text-white">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold">
              {assistant?.assistant_name || "MotoLead AI"}
            </h1>

            <p className="text-slate-400 mt-2 text-lg">
              {assistant?.greeting}, Witsan.
            </p>

            <p className="text-2xl font-bold mt-5 max-w-4xl">
              {assistant?.executive_summary}
            </p>
          </div>

          <div className={`px-5 py-3 rounded-2xl font-black text-center ${urgencyColor(assistant?.urgency?.level)}`}>
            {assistant?.urgency?.label}
          </div>
        </div>

        <p className="text-slate-400 mt-4">
          {assistant?.urgency?.message}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8">
        <p className="text-slate-400 text-sm">
          Recomendação principal da IA
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {assistant?.main_recommendation?.title}
        </h2>

        <p className="text-slate-300 mt-3">
          {assistant?.main_recommendation?.description}
        </p>

        <button
          onClick={() =>
            navigate(
              assistant?.main_recommendation?.route || "/"
            )
          }
          className="mt-5 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold"
        >
          {assistant?.main_recommendation?.action || "Executar ação"}
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <p className="text-slate-400 text-sm">
            Leads
          </p>

          <h2 className="text-3xl font-black mt-2">
            {metric(metrics.leads)}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <p className="text-slate-400 text-sm">
            Leads quentes
          </p>

          <h2 className="text-3xl font-black mt-2 text-red-400">
            {metric(metrics.hot_leads)}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <p className="text-slate-400 text-sm">
            Follow-ups vencidos
          </p>

          <h2 className="text-3xl font-black mt-2 text-yellow-400">
            {metric(metrics.overdue_followups)}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <p className="text-slate-400 text-sm">
            Ações hoje
          </p>

          <h2 className="text-3xl font-black mt-2 text-green-400">
            {metric(metrics.actions_today)}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <p className="text-slate-400 text-sm">
            Oportunidades
          </p>

          <h2 className="text-3xl font-black mt-2">
            {metric(metrics.opportunities)}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <p className="text-slate-400 text-sm">
            Recuperação
          </p>

          <h2 className="text-3xl font-black mt-2 text-red-400">
            {metric(metrics.recovery_leads)}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <p className="text-slate-400 text-sm">
            Negociando
          </p>

          <h2 className="text-3xl font-black mt-2 text-blue-400">
            {metric(metrics.negotiating)}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <p className="text-slate-400 text-sm">
            Leads frios
          </p>

          <h2 className="text-3xl font-black mt-2">
            {metric(metrics.cold_leads)}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-5">
            Prioridades agora
          </h2>

          <div className="space-y-4">
            {(assistant?.priorities || []).map((item, index) => (
              <div
                key={index}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold mb-3 ${priorityColor(item.priority)}`}>
                      Prioridade {item.priority}
                    </span>

                    <h3 className="font-bold text-lg">
                      {item.title}
                    </h3>

                    <p className="text-slate-400 text-sm mt-2">
                      {item.description}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate(item.route || "/")
                    }
                    className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-bold"
                  >
                    {item.action}
                  </button>
                </div>
              </div>
            ))}

            {!assistant?.priorities?.length && (
              <p className="text-slate-400">
                Nenhuma prioridade crítica agora.
              </p>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-5">
            Plano do dia
          </h2>

          <div className="space-y-4">
            {(assistant?.daily_plan || []).map((task, index) => (
              <div
                key={index}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4"
              >
                <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold mb-3 ${priorityColor(task.priority)}`}>
                  #{task.priority}
                </span>

                <h3 className="font-bold">
                  {task.title}
                </h3>

                <p className="text-slate-400 text-sm mt-2">
                  {task.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {coach && (
  <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
      <div>
        <h2 className="text-2xl font-bold">
          AutoCoach Comercial
        </h2>

        <p className="text-slate-400 mt-2">
          Diagnóstico da sua operação comercial hoje.
        </p>
      </div>

      <div className="bg-blue-600 px-5 py-3 rounded-2xl font-black text-xl">
        Score {coach.score}
      </div>
    </div>

    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-5">
      <h3 className="font-bold text-lg">
        Diagnóstico
      </h3>

      <p className="text-slate-300 mt-2">
        {coach.diagnosis}
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
        <h3 className="font-bold text-green-400">
          Pontos fortes
        </h3>

        <div className="space-y-2 mt-3">
          {(coach.strengths || []).map((item, index) => (
            <p
              key={index}
              className="text-slate-300 text-sm"
            >
              ✓ {item}
            </p>
          ))}
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
        <h3 className="font-bold text-red-400">
          Pontos de atenção
        </h3>

        <div className="space-y-2 mt-3">
          {(coach.problems || []).map((item, index) => (
            <p
              key={index}
              className="text-slate-300 text-sm"
            >
              ⚠ {item}
            </p>
          ))}
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
        <h3 className="font-bold text-blue-400">
          Próximas 2 horas
        </h3>

        <div className="space-y-2 mt-3">
          {(coach.next_2_hours || []).map((item, index) => (
            <p
              key={index}
              className="text-slate-300 text-sm"
            >
              {index + 1}. {item}
            </p>
          ))}
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
        <h3 className="font-bold text-yellow-400">
          Metas de hoje
        </h3>

        <div className="space-y-2 mt-3">
          {(coach.daily_targets || []).map((item, index) => (
            <p
              key={index}
              className="text-slate-300 text-sm"
            >
              🎯 {item}
            </p>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mt-5">
      <h3 className="font-bold">
        Conselho da gestora IA
      </h3>

      <p className="text-slate-300 mt-2">
        {coach.manager_advice}
      </p>
    </div>
  </div>
)}

        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-5">
            Consultoria da IA
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(assistant?.insights || []).map((insight, index) => (
              <div
                key={index}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4"
              >
                <h3 className="font-bold">
                  {insight.title}
                </h3>

                <p className="text-slate-400 text-sm mt-2">
                  {insight.description}
                </p>
              </div>
            ))}

            {!assistant?.insights?.length && (
              <p className="text-slate-400">
                Nenhum insight disponível agora.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}