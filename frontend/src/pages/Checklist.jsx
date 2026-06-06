import { useEffect, useState } from "react"
import api from "../services/api"

export default function Checklist() {

  const [clientes, setClientes] =
    useState([])

  const [checklist, setChecklist] =
    useState([])

  useEffect(() => {

    carregarLeads()
    carregarChecklist()

  }, [])

  async function carregarLeads() {

    try {

      const response =
        await api.get("/leads")

      setClientes(response.data)

    } catch (err) {

      console.log(err)

    }

  }

  async function carregarChecklist() {

    try {

      const response =
        await api.get("/checklist")

      setChecklist(response.data)

    } catch (err) {

      console.log(err)

    }

  }

  async function marcarAtendido(id) {

    try {

      await api.post(
        "/checklist",
        {
          lead_id: id,
          completed: true
        }
      )

      carregarChecklist()

    } catch (err) {

      console.log(err)

    }

  }

  const totalAtendidos =
    checklist.length

  const metaDiaria = 10

  const progresso =
    Math.min(
      (totalAtendidos / metaDiaria) * 100,
      100
    )

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold text-white">
          Checklist Diário
        </h1>

        <p className="text-slate-400 mt-2">
          Entre em contato com pelo menos 10 clientes por dia.
        </p>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <div className="mb-6">

          <h2 className="text-xl font-bold text-white">
            Meta do Dia
          </h2>

          <p className="text-slate-400 mt-2">
            {totalAtendidos} / {metaDiaria} contatos realizados
          </p>

          <div className="w-full bg-slate-800 h-4 rounded-full mt-4 overflow-hidden">

            <div
              className="bg-green-500 h-4 transition-all duration-500"
              style={{
                width: `${progresso}%`
              }}
            />

          </div>

          {totalAtendidos >= metaDiaria && (

            <div className="mt-4 bg-green-600 text-white px-4 py-3 rounded-2xl font-bold">

              🎉 Meta diária concluída!

            </div>

          )}

        </div>

        <div className="space-y-3">

          {clientes.map(cliente => {

            const concluido =
              checklist.some(
                item =>
                  item.lead_id === cliente.id
              )

            return (

              <div
                key={cliente.id}
                className="
                  bg-slate-800
                  rounded-2xl
                  p-4
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <h3 className="font-bold text-white">
                    {cliente.company_name}
                  </h3>

                  <p className="text-slate-400 text-sm">
                    {cliente.city}
                  </p>

                </div>

                <button
                  onClick={() =>
                    marcarAtendido(cliente.id)
                  }
                  disabled={concluido}
                  className={
                    concluido
                      ? `
                        bg-green-600
                        text-white
                        px-5
                        py-2
                        rounded-xl
                        cursor-not-allowed
                      `
                      : `
                        bg-red-600
                        hover:bg-red-700
                        text-white
                        px-5
                        py-2
                        rounded-xl
                        transition
                      `
                  }
                >

                  {concluido
                    ? "✓ Atendido"
                    : "Marcar"}

                </button>

              </div>

            )

          })}

          {clientes.length === 0 && (

            <div className="text-center text-slate-400 py-10">

              Nenhum cliente encontrado.

            </div>

          )}

        </div>

      </div>

    </div>

  )

}