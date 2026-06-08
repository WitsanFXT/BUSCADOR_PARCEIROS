import { useEffect, useState } from "react"
import api from "../services/api"

export default function Checklist() {

  const [clientes, setClientes] =
    useState([])

  const [checklistHoje, setChecklistHoje] =
    useState([])

  const [historico, setHistorico] =
    useState([])

  const [aba, setAba] =
    useState("dia")

  useEffect(() => {

    carregarDados()

  }, [])

  async function carregarDados() {

    await Promise.all([
      carregarLeads(),
      carregarChecklistHoje(),
      carregarHistorico()
    ])

  }

  async function carregarLeads() {

    try {

      const response =
        await api.get("/leads")

      setClientes(response.data)

    } catch (err) {

      console.log(err)

    }

  }

  async function carregarChecklistHoje() {

    try {

      const response =
        await api.get("/checklist")

      setChecklistHoje(response.data)

    } catch (err) {

      console.log(err)

    }

  }

  async function carregarHistorico() {

    try {

      const response =
        await api.get("/checklist/all")

      setHistorico(response.data)

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

      carregarChecklistHoje()
      carregarHistorico()

    } catch (err) {

      console.log(err)

    }

  }

  async function desmarcarAtendido(id) {

    try {

      await api.delete(
        `/checklist/${id}`
      )

      carregarChecklistHoje()
      carregarHistorico()

    } catch (err) {

      console.log(err)

    }

  }

  function estaAtendidoHoje(id) {

    return checklistHoje.some(
      item =>
        item.lead_id === id
    )

  }

  function jaFoiContatado(id) {

    return historico.some(
      item =>
        item.lead_id === id
    )

  }

  function buscarClientePorId(id) {

    return clientes.find(
      cliente =>
        cliente.id === id
    )

  }

  function formatarData(data) {

    if (!data) return "-"

    return new Date(data)
      .toLocaleDateString("pt-BR")

  }

  const atendidosHoje =
    clientes.filter(cliente =>
      estaAtendidoHoje(cliente.id)
    )

  const sugestoesDoDia =
    clientes
      .filter(cliente =>
        !estaAtendidoHoje(cliente.id)
      )
      .slice(0, 10)

  const nuncaContatados =
    clientes.filter(cliente =>
      !jaFoiContatado(cliente.id)
    )

  const totalAtendidos =
    checklistHoje.length

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
          Organize seus contatos diários, acompanhe histórico e encontre leads esquecidos.
        </p>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <div className="mb-6">

          <h2 className="text-xl font-bold text-white">
            Meta do Dia
          </h2>

          <p className="text-slate-400 mt-2">
            {totalAtendidos} / {metaDiaria} contatos realizados hoje
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">

          <button
            onClick={() =>
              setAba("dia")
            }
            className={
              aba === "dia"
                ? "bg-red-600 text-white px-5 py-3 rounded-xl font-bold"
                : "bg-slate-800 text-slate-300 px-5 py-3 rounded-xl font-bold hover:bg-slate-700"
            }
          >
            10 do Dia ({sugestoesDoDia.length})
          </button>

          <button
            onClick={() =>
              setAba("hoje")
            }
            className={
              aba === "hoje"
                ? "bg-green-600 text-white px-5 py-3 rounded-xl font-bold"
                : "bg-slate-800 text-slate-300 px-5 py-3 rounded-xl font-bold hover:bg-slate-700"
            }
          >
            Atendidos Hoje ({atendidosHoje.length})
          </button>

          <button
            onClick={() =>
              setAba("nunca")
            }
            className={
              aba === "nunca"
                ? "bg-blue-600 text-white px-5 py-3 rounded-xl font-bold"
                : "bg-slate-800 text-slate-300 px-5 py-3 rounded-xl font-bold hover:bg-slate-700"
            }
          >
            Nunca Contatados ({nuncaContatados.length})
          </button>

          <button
            onClick={() =>
              setAba("historico")
            }
            className={
              aba === "historico"
                ? "bg-purple-600 text-white px-5 py-3 rounded-xl font-bold"
                : "bg-slate-800 text-slate-300 px-5 py-3 rounded-xl font-bold hover:bg-slate-700"
            }
          >
            Histórico ({historico.length})
          </button>

        </div>

        {aba === "dia" && (

          <div>

            <p className="text-slate-400 mb-4">
              Sugestões de até 10 leads que ainda não foram atendidos hoje.
            </p>

            <div className="space-y-3">

              {sugestoesDoDia.map(cliente => (

                <div
                  key={cliente.id}
                  className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                >

                  <div>

                    <h3 className="font-bold text-white">
                      {cliente.company_name}
                    </h3>

                    <p className="text-slate-400 text-sm">
                      {cliente.city || "Cidade não informada"}
                    </p>

                    <p className="text-slate-500 text-xs mt-1">
                      {cliente.phone || "Sem telefone"}
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      marcarAtendido(cliente.id)
                    }
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl transition"
                  >
                    Marcar
                  </button>

                </div>

              ))}

              {sugestoesDoDia.length === 0 && (

                <div className="text-center text-slate-400 py-10">
                  Nenhuma sugestão disponível para hoje.
                </div>

              )}

            </div>

          </div>

        )}

        {aba === "hoje" && (

          <div>

            <p className="text-slate-400 mb-4">
              Leads marcados como atendidos hoje.
            </p>

            <div className="space-y-3">

              {atendidosHoje.map(cliente => (

                <div
                  key={cliente.id}
                  className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                >

                  <div>

                    <h3 className="font-bold text-white">
                      {cliente.company_name}
                    </h3>

                    <p className="text-slate-400 text-sm">
                      {cliente.city || "Cidade não informada"}
                    </p>

                    <p className="text-green-400 text-xs mt-1">
                      ✓ Atendido hoje
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      desmarcarAtendido(cliente.id)
                    }
                    className="bg-slate-600 hover:bg-slate-500 text-white px-5 py-2 rounded-xl transition"
                  >
                    Desmarcar
                  </button>

                </div>

              ))}

              {atendidosHoje.length === 0 && (

                <div className="text-center text-slate-400 py-10">
                  Nenhum lead atendido hoje.
                </div>

              )}

            </div>

          </div>

        )}

        {aba === "nunca" && (

          <div>

            <p className="text-slate-400 mb-4">
              Leads que nunca possuem registro de atendimento.
            </p>

            <div className="space-y-3">

              {nuncaContatados.map(cliente => (

                <div
                  key={cliente.id}
                  className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                >

                  <div>

                    <h3 className="font-bold text-white">
                      {cliente.company_name}
                    </h3>

                    <p className="text-slate-400 text-sm">
                      {cliente.city || "Cidade não informada"}
                    </p>

                    <p className="text-yellow-400 text-xs mt-1">
                      Nunca contatado
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      marcarAtendido(cliente.id)
                    }
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl transition"
                  >
                    Marcar
                  </button>

                </div>

              ))}

              {nuncaContatados.length === 0 && (

                <div className="text-center text-slate-400 py-10">
                  Todos os leads já possuem algum contato registrado.
                </div>

              )}

            </div>

          </div>

        )}

        {aba === "historico" && (

          <div>

            <p className="text-slate-400 mb-4">
              Histórico completo de atendimentos registrados.
            </p>

            <div className="space-y-3">

              {historico.map(item => {

                const cliente =
                  buscarClientePorId(item.lead_id)

                return (

                  <div
                    key={item.id}
                    className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >

                    <div>

                      <h3 className="font-bold text-white">
                        {cliente?.company_name || "Lead removido"}
                      </h3>

                      <p className="text-slate-400 text-sm">
                        {cliente?.city || "Cidade não informada"}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-green-400 font-bold">
                        Atendido
                      </p>

                      <p className="text-slate-400 text-sm">
                        {formatarData(item.contact_date)}
                      </p>

                    </div>

                  </div>

                )

              })}

              {historico.length === 0 && (

                <div className="text-center text-slate-400 py-10">
                  Nenhum atendimento registrado no histórico.
                </div>

              )}

            </div>

          </div>

        )}

      </div>

    </div>

  )

}