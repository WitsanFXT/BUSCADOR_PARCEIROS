import { useEffect, useState } from "react"
import api from "../services/api"

export default function Missions() {

  const [missions, setMissions] =
    useState([])

  useEffect(() => {

    loadMissions()

  }, [])

  async function loadMissions() {

    try {

      const response =
        await api.get("/missions")

      setMissions(response.data)

    } catch (err) {

      console.log(err)

    }

  }

  async function updateMission(id, completed) {

    try {

      await api.put(
        `/missions/${id}`,
        {
          completed
        }
      )

      loadMissions()

    } catch (err) {

      console.log(err)
      alert("Erro ao atualizar missão")

    }

  }

  async function resetMissions() {

    const confirmReset =
      window.confirm(
        "Deseja resetar as missões de hoje?"
      )

    if (!confirmReset) return

    try {

      await api.post("/missions/reset")

      loadMissions()

    } catch (err) {

      console.log(err)
      alert("Erro ao resetar missões")

    }

  }

  function increase(item) {

    const nextValue =
      Math.min(
        item.completed + 1,
        item.target
      )

    updateMission(
      item.id,
      nextValue
    )

  }

  function decrease(item) {

    const nextValue =
      Math.max(
        item.completed - 1,
        0
      )

    updateMission(
      item.id,
      nextValue
    )

  }

  function complete(item) {

    updateMission(
      item.id,
      item.target
    )

  }

  function getProgress(item) {

    if (!item.target) return 0

    return Math.min(
      Math.round(
        (item.completed / item.target) * 100
      ),
      100
    )

  }

  function getColor(progress) {

    if (progress >= 100) return "bg-green-500"
    if (progress >= 50) return "bg-yellow-500"
    return "bg-red-600"

  }

  const totalTarget =
    missions.reduce(
      (sum, item) =>
        sum + item.target,
      0
    )

  const totalCompleted =
    missions.reduce(
      (sum, item) =>
        sum + item.completed,
      0
    )

  const totalProgress =
    totalTarget
      ? Math.min(
          Math.round(
            (totalCompleted / totalTarget) * 100
          ),
          100
        )
      : 0

  return (

    <div className="space-y-6 text-white">

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

        <div>

          <h1 className="text-4xl font-bold">
            Missões do Dia
          </h1>

          <p className="text-slate-400 mt-2">
            Plano diário para gerar mais conversas, indicações e oportunidades.
          </p>

        </div>

        <button
          onClick={resetMissions}
          className="bg-slate-700 hover:bg-slate-600 px-5 py-3 rounded-xl font-bold"
        >
          Resetar Dia
        </button>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

          <div>

            <h2 className="text-2xl font-bold">
              Progresso Geral
            </h2>

            <p className="text-slate-400 mt-2">
              {totalCompleted} / {totalTarget} ações concluídas
            </p>

          </div>

          <div className="text-5xl font-bold text-green-400">
            {totalProgress}%
          </div>

        </div>

        <div className="w-full bg-slate-800 h-4 rounded-full mt-5 overflow-hidden">

          <div
            className="bg-green-500 h-4 transition-all duration-500"
            style={{
              width: `${totalProgress}%`
            }}
          />

        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {missions.map(item => {

          const progress =
            getProgress(item)

          return (

            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-slate-400 text-sm">
                    {item.category}
                  </p>

                  <h3 className="text-2xl font-bold mt-1">
                    {item.title}
                  </h3>

                  <p className="text-slate-400 mt-3">
                    {item.completed} / {item.target} concluído
                  </p>

                </div>

                <div className="text-3xl font-bold">
                  {progress}%
                </div>

              </div>

              <div className="w-full bg-slate-800 h-3 rounded-full mt-5 overflow-hidden">

                <div
                  className={`${getColor(progress)} h-3 transition-all duration-500`}
                  style={{
                    width: `${progress}%`
                  }}
                />

              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">

                <button
                  onClick={() =>
                    decrease(item)
                  }
                  className="bg-slate-700 hover:bg-slate-600 p-3 rounded-xl font-bold"
                >
                  -1
                </button>

                <button
                  onClick={() =>
                    increase(item)
                  }
                  className="bg-blue-600 hover:bg-blue-700 p-3 rounded-xl font-bold"
                >
                  +1
                </button>

                <button
                  onClick={() =>
                    complete(item)
                  }
                  className="bg-green-600 hover:bg-green-700 p-3 rounded-xl font-bold"
                >
                  Feito
                </button>

              </div>

            </div>

          )

        })}

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <h2 className="text-2xl font-bold">
          Como cumprir as missões hoje
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">

          <div className="bg-slate-800 p-4 rounded-2xl">
            <h3 className="font-bold">
              WhatsApp
            </h3>
            <p className="text-slate-400 text-sm mt-2">
              Chame leads quentes da Agenda Inteligente primeiro.
            </p>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl">
            <h3 className="font-bold">
              Marketplace
            </h3>
            <p className="text-slate-400 text-sm mt-2">
              Procure anúncios de Factor, Fazer, Crosser, CG e Bros.
            </p>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl">
            <h3 className="font-bold">
              Indicação
            </h3>
            <p className="text-slate-400 text-sm mt-2">
              Peça indicação para clientes, oficinas, motopeças e motoboys.
            </p>
          </div>

        </div>

      </div>

    </div>

  )

}