import { useEffect, useState } from "react"
import api from "../services/api"

export default function Agenda() {

  const [priorities, setPriorities] =
    useState([])

  const [followups, setFollowups] =
    useState([])

  useEffect(() => {

    loadData()

  }, [])

  async function loadData() {

    try {

      const [prioritiesResponse, followupsResponse] =
        await Promise.all([
          api.get("/agenda/priorities"),
          api.get("/agenda/followups")
        ])

      setPriorities(prioritiesResponse.data)
      setFollowups(followupsResponse.data)

    } catch (err) {

      console.log(err)

    }

  }

  function today() {

    return new Date()
      .toISOString()
      .split("T")[0]

  }

  function addDays(days) {

    const date =
      new Date()

    date.setDate(
      date.getDate() + days
    )

    return date
      .toISOString()
      .split("T")[0]

  }

  function getColor(score) {

    if (score >= 80) return "bg-green-600"
    if (score >= 40) return "bg-yellow-500"
    return "bg-red-600"

  }

  function generateMessage(item) {

    if (item.type === "followup") {

      return `Olá, tudo bem? Passando para retomar nosso contato. Você ainda tem interesse em analisar uma possibilidade de moto 0km com condições acessíveis?`

    }

    if (item.type === "opportunity") {

      return `Olá, tudo bem? Vi uma oportunidade de conversar com você sobre moto 0km. Sou consultor Yamaha e posso fazer uma simulação sem compromisso para você avaliar se compensa trocar agora.`

    }

    return `Olá, tudo bem? Sou consultor Yamaha. Estou entrando em contato para verificar se você ainda tem interesse em conhecer condições para uma moto 0km. Posso fazer uma simulação sem compromisso?`

  }

  function copyMessage(item) {

    navigator.clipboard.writeText(
      generateMessage(item)
    )

    alert("Mensagem copiada!")

  }

  async function scheduleFollowup(item) {

    const days =
      window.prompt(
        "Agendar retorno para daqui quantos dias?",
        "3"
      )

    if (!days) return

    const notes =
      window.prompt(
        "Observação do follow-up:",
        "Retornar contato e verificar interesse."
      )

    try {

      await api.post(
        "/agenda/followups",
        {
          lead_id:
            item.type === "lead"
              ? item.id
              : item.lead_id || null,
          opportunity_id:
            item.type === "opportunity"
              ? item.id
              : item.opportunity_id || null,
          title: item.title,
          contact_name: item.title,
          phone: item.phone || "",
          source: item.type,
          next_contact_date:
            addDays(Number(days)),
          notes
        }
      )

      alert("Follow-up agendado!")

      loadData()

    } catch (err) {

      console.log(err)
      alert("Erro ao agendar follow-up")

    }

  }

  async function markDone(id) {

    try {

      await api.put(
        `/agenda/followups/${id}/done`
      )

      loadData()

    } catch (err) {

      console.log(err)
      alert("Erro ao concluir follow-up")

    }

  }

  const topPriority =
    priorities[0]

  const dueToday =
    followups.filter(item =>
      item.status === "Pendente" &&
      item.next_contact_date <= today()
    )

  const pending =
    followups.filter(item =>
      item.status === "Pendente"
    )

  return (

    <div className="space-y-6 text-white">

      <div>

        <h1 className="text-4xl font-bold">
          Agenda Inteligente
        </h1>

        <p className="text-slate-400 mt-2">
          O sistema organiza quem você deve abordar primeiro hoje.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-green-600 rounded-3xl p-5">

          <p className="text-sm opacity-80">
            Prioridades Hoje
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {priorities.length}
          </h2>

        </div>

        <div className="bg-red-600 rounded-3xl p-5">

          <p className="text-sm opacity-80">
            Follow-ups Hoje/Atrasados
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {dueToday.length}
          </h2>

        </div>

        <div className="bg-blue-600 rounded-3xl p-5">

          <p className="text-sm opacity-80">
            Follow-ups Pendentes
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {pending.length}
          </h2>

        </div>

      </div>

      {topPriority && (

        <div className="bg-slate-900 border border-green-600 rounded-3xl p-6">

          <p className="text-green-400 font-bold">
            🔥 Prioridade Máxima do Dia
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {topPriority.title}
          </h2>

          <p className="text-slate-400 mt-2">
            {topPriority.reason}
          </p>

          <div className="flex flex-wrap gap-3 mt-5">

            <span className={`${getColor(topPriority.score)} px-4 py-2 rounded-xl font-bold`}>
              Score {topPriority.score}
            </span>

            <span className="bg-blue-600 px-4 py-2 rounded-xl font-bold">
              {topPriority.probability}% chance
            </span>

            <span className="bg-slate-700 px-4 py-2 rounded-xl font-bold">
              {topPriority.label}
            </span>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">

            <button
              onClick={() =>
                copyMessage(topPriority)
              }
              className="bg-blue-600 hover:bg-blue-700 p-3 rounded-xl font-bold"
            >
              Copiar Mensagem
            </button>

            <button
              onClick={() =>
                scheduleFollowup(topPriority)
              }
              className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded-xl font-bold"
            >
              Agendar Follow-up
            </button>

            {topPriority.phone ? (

              <a
                href={`https://wa.me/55${topPriority.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 hover:bg-green-700 p-3 rounded-xl font-bold text-center"
              >
                WhatsApp
              </a>

            ) : (

              <button
                disabled
                className="bg-slate-700 opacity-50 p-3 rounded-xl font-bold"
              >
                Sem WhatsApp
              </button>

            )}

          </div>

        </div>

      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <h2 className="text-2xl font-bold mb-5">
          Lista de Prioridades
        </h2>

        <div className="space-y-4">

          {priorities.map((item, index) => (

            <div
              key={`${item.type}-${item.id}`}
              className="bg-slate-800 rounded-2xl p-5"
            >

              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

                <div>

                  <p className="text-slate-400 text-sm">
                    #{index + 1} • {item.type}
                  </p>

                  <h3 className="text-xl font-bold mt-1">
                    {item.title}
                  </h3>

                  <p className="text-slate-400 mt-2">
                    {item.reason}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">

                    <span className={`${getColor(item.score)} px-3 py-1 rounded-xl text-sm font-bold`}>
                      Score {item.score}
                    </span>

                    <span className="bg-blue-600 px-3 py-1 rounded-xl text-sm font-bold">
                      {item.probability}% chance
                    </span>

                    <span className="bg-slate-700 px-3 py-1 rounded-xl text-sm font-bold">
                      {item.status}
                    </span>

                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                  <button
                    onClick={() =>
                      copyMessage(item)
                    }
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-bold"
                  >
                    Mensagem
                  </button>

                  <button
                    onClick={() =>
                      scheduleFollowup(item)
                    }
                    className="bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-xl font-bold"
                  >
                    Follow-up
                  </button>

                  {item.phone ? (

                    <a
                      href={`https://wa.me/55${item.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-bold text-center"
                    >
                      WhatsApp
                    </a>

                  ) : (

                    <button
                      disabled
                      className="bg-slate-700 opacity-50 px-4 py-3 rounded-xl font-bold"
                    >
                      Sem WhatsApp
                    </button>

                  )}

                </div>

              </div>

            </div>

          ))}

          {priorities.length === 0 && (

            <div className="text-center text-slate-400 py-10">
              Nenhuma prioridade encontrada.
            </div>

          )}

        </div>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <h2 className="text-2xl font-bold mb-5">
          Follow-ups Pendentes
        </h2>

        <div className="space-y-4">

          {pending.map(item => (

            <div
              key={item.id}
              className="bg-slate-800 rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
            >

              <div>

                <h3 className="text-xl font-bold">
                  {item.contact_name || item.title}
                </h3>

                <p className="text-slate-400 mt-2">
                  Retorno em: {new Date(item.next_contact_date).toLocaleDateString("pt-BR")}
                </p>

                <p className="text-slate-500 text-sm mt-1">
                  {item.notes}
                </p>

              </div>

              <button
                onClick={() =>
                  markDone(item.id)
                }
                className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold"
              >
                Concluir
              </button>

            </div>

          ))}

          {pending.length === 0 && (

            <div className="text-center text-slate-400 py-10">
              Nenhum follow-up pendente.
            </div>

          )}

        </div>

      </div>

    </div>

  )

}