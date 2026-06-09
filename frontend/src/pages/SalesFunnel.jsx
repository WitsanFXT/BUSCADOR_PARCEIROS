import { useEffect, useState } from "react"
import api from "../services/api"

const stages = [
  "Lead Encontrado",
  "Primeiro Contato",
  "Interessado",
  "Simulação Enviada",
  "Documentação",
  "Análise de Crédito",
  "Venda Realizada",
  "Perdido"
]

export default function SalesFunnel() {

  const [items, setItems] =
    useState([])

  const [draggedItem, setDraggedItem] =
    useState(null)

  const [predictions, setPredictions] =
  useState({})

  const [predictingId, setPredictingId] =
  useState(null)

  const [generatingAI, setGeneratingAI] =
  useState(null)

  const [aiMessages, setAiMessages] =
  useState({})
  

  const [form, setForm] =
    useState({
      customer_name: "",
      phone: "",
      city: "",
      motorcycle_interest: "",
      notes: ""
    })

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    try {
      const response =
        await api.get("/sales-funnel")

      setItems(response.data)
    } catch (err) {
      console.log(err)
    }
  }

  function updateField(field, value) {
    setForm({
      ...form,
      [field]: value
    })
  }

  async function createItem() {
    if (!form.customer_name.trim()) {
      alert("Informe o nome do cliente")
      return
    }

    try {
      await api.post(
        "/sales-funnel",
        {
          ...form,
          current_stage: "Lead Encontrado"
        }
      )

      setForm({
        customer_name: "",
        phone: "",
        city: "",
        motorcycle_interest: "",
        notes: ""
      })

      loadItems()
    } catch (err) {
      console.log(err)
      alert("Erro ao criar lead no funil")
    }
  }

  async function moveStage(item, stage) {
    try {
      await api.put(
        `/sales-funnel/${item.id}/stage`,
        {
          stage
        }
      )

      setItems(prev =>
        prev.map(prevItem =>
          prevItem.id === item.id
            ? {
                ...prevItem,
                current_stage: stage
              }
            : prevItem
        )
      )

      loadItems()
    } catch (err) {
      console.log(err)
      alert("Erro ao mover etapa")
    }
  }

  function handleDragStart(item) {
    setDraggedItem(item)
  }

  function handleDragOver(event) {
    event.preventDefault()
  }

  async function handleDrop(stage) {
    if (!draggedItem) return

    await moveStage(
      draggedItem,
      stage
    )

    setDraggedItem(null)
  }

  async function deleteItem(id) {
    const confirmDelete =
      window.confirm(
        "Deseja remover este item do funil?"
      )

    if (!confirmDelete) return

    try {
      await api.delete(
        `/sales-funnel/${id}`
      )

      loadItems()
    } catch (err) {
      console.log(err)
      alert("Erro ao remover do funil")
    }
  }

  async function generateStageMessage(item) {
  try {

    setGeneratingAI(item.id)

    let objective =
      "followup"

    switch (item.current_stage) {

      case "Lead Encontrado":
        objective = "first_contact"
        break

      case "Primeiro Contato":
        objective = "followup"
        break

      case "Interessado":
        objective = "simulation"
        break

      case "Simulação Enviada":
        objective = "objection"
        break

      case "Documentação":
        objective = "closing"
        break

      case "Análise de Crédito":
        objective = "closing"
        break

      case "Perdido":
        objective = "recovery"
        break

      default:
        objective = "followup"
    }

    const response =
  await api.post(
    "/assistant/generate",
    {
      objective,
      extra: {
        stage: item.current_stage,
        context: `
Cliente: ${item.customer_name}
Telefone: ${item.phone || "Não informado"}
Cidade: ${item.city || "Não informada"}
Interesse: ${item.motorcycle_interest || "Não informado"}
Etapa do funil: ${item.current_stage}
Observações: ${item.notes || "Nenhuma"}
        `
      }
    }
  )

    setAiMessages(prev => ({
      ...prev,
      [item.id]:
        response.data
    }))

  } catch (err) {

    console.log(err)

    alert(
      "Erro ao gerar mensagem IA"
    )

  } finally {

    setGeneratingAI(null)

  }
}

async function predictLead(item) {
  try {
    setPredictingId(item.id)

    const response =
      await api.post(
        "/assistant/predict",
        {
          lead: {
            company_name:
              item.customer_name,
            city:
              item.city,
            interest:
              item.motorcycle_interest,
            lead_score:
              item.probability || 0,
            status:
              item.current_stage
          },
          context:
            `Lead na etapa ${item.current_stage}. Observações: ${item.notes || "Nenhuma"}`
        }
      )

    setPredictions(prev => ({
      ...prev,
      [item.id]: response.data
    }))

  } catch (err) {
    console.log(err)
    alert("Erro ao analisar lead")
  } finally {
    setPredictingId(null)
  }
}

  function getStageItems(stage) {
    return items.filter(item =>
      item.current_stage === stage
    )
  }

  function getStageColor(stage) {
    if (stage === "Venda Realizada") return "border-green-600"
    if (stage === "Perdido") return "border-red-600"
    if (stage === "Análise de Crédito") return "border-blue-600"
    if (stage === "Simulação Enviada") return "border-yellow-500"
    if (stage === "Interessado") return "border-purple-600"

    return "border-slate-700"
  }

  const total =
    items.length

  const sales =
    items.filter(item =>
      item.current_stage === "Venda Realizada"
    ).length

  const lost =
    items.filter(item =>
      item.current_stage === "Perdido"
    ).length

  const active =
    items.filter(item =>
      item.current_stage !== "Venda Realizada" &&
      item.current_stage !== "Perdido"
    ).length

  const conversion =
    total
      ? Math.round(
          (sales / total) * 100
        )
      : 0

  return (

    <div className="space-y-6 text-white">

      <div>

        <h1 className="text-4xl font-bold">
          Funil de Vendas
        </h1>

        <p className="text-slate-400 mt-2">
          Arraste os cards entre as etapas conforme o cliente avança.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-blue-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Total no Funil
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {total}
          </h2>
        </div>

        <div className="bg-yellow-500 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Em Andamento
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {active}
          </h2>
        </div>

        <div className="bg-green-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Vendas
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {sales}
          </h2>
        </div>

        <div className="bg-red-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Conversão
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {conversion}%
          </h2>
        </div>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <h2 className="text-2xl font-bold mb-5">
          Adicionar Cliente ao Funil
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

          <input
            placeholder="Nome do cliente"
            value={form.customer_name}
            onChange={(e) =>
              updateField("customer_name", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <input
            placeholder="Telefone"
            value={form.phone}
            onChange={(e) =>
              updateField("phone", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <input
            placeholder="Cidade"
            value={form.city}
            onChange={(e) =>
              updateField("city", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <input
            placeholder="Interesse. Ex: Factor"
            value={form.motorcycle_interest}
            onChange={(e) =>
              updateField("motorcycle_interest", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <button
            onClick={createItem}
            className="bg-red-600 hover:bg-red-700 rounded-xl font-bold"
          >
            Adicionar
          </button>

        </div>

        <textarea
          placeholder="Observações"
          value={form.notes}
          onChange={(e) =>
            updateField("notes", e.target.value)
          }
          className="w-full bg-slate-800 p-3 rounded-xl outline-none mt-4 min-h-24"
        />

      </div>

      <div className="overflow-x-auto pb-6">

        <div className="flex gap-5 min-w-max">

          {stages.map(stage => {

            const stageItems =
              getStageItems(stage)

            return (

              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={() =>
                  handleDrop(stage)
                }
                className={`
                  bg-slate-900
                  border
                  ${getStageColor(stage)}
                  rounded-3xl
                  p-5
                  w-[360px]
                  min-h-[650px]
                  flex-shrink-0
                `}
              >

                <div className="flex items-center justify-between mb-5">

                  <h3 className="font-bold text-xl leading-tight">
                    {stage}
                  </h3>

                  <span className="bg-slate-800 px-3 py-1 rounded-full text-sm">
                    {stageItems.length}
                  </span>

                </div>

                <div className="space-y-4">

                  {stageItems.map(item => (

                    <div
                      key={item.id}
                      draggable
                      onDragStart={() =>
                        handleDragStart(item)
                      }
                      className="
                        bg-slate-800
                        rounded-2xl
                        p-5
                        cursor-grab
                        active:cursor-grabbing
                        hover:bg-slate-700
                        transition
                        border
                        border-slate-700
                        shadow-lg
                      "
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <h4 className="font-bold text-lg">
                            {item.customer_name}
                          </h4>

                          <p className="text-slate-400 text-sm mt-1">
                            {item.city || "Sem cidade"}
                          </p>

                        </div>

                        <span className="bg-blue-600 px-3 py-1 rounded-xl text-xs font-bold">
                          {item.probability}%
                        </span>

                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-300">

                        <p>
                          <span className="text-slate-500">
                            Interesse:
                          </span>{" "}
                          {item.motorcycle_interest || "Não informado"}
                        </p>

                        <p>
                          <span className="text-slate-500">
                            Telefone:
                          </span>{" "}
                          {item.phone || "Não informado"}
                        </p>

                        {item.notes && (

                          <p className="text-slate-400 line-clamp-3">
                            {item.notes}
                          </p>

                        )}

                        {aiMessages[item.id] && (

  <div className="
    mt-4
    bg-slate-900
    border
    border-slate-700
    rounded-xl
    p-3
  ">

    <p className="
      text-xs
      text-slate-400
      mb-2
      font-bold
    ">
      Sugestão IA
    </p>

    <p className="
      text-sm
      text-slate-200
      whitespace-pre-line
    ">
      {
        aiMessages[item.id].message ||
aiMessages[item.id].answer ||
aiMessages[item.id].variations?.[0] ||
aiMessages[item.id].advice ||
""
      }
    </p>

  </div>

)}

{predictions[item.id] && (
  <div className="mt-4 bg-slate-950 border border-blue-700 rounded-xl p-3">
    <p className="text-blue-400 text-xs font-bold mb-2">
      Análise Preditiva IA
    </p>

    <div className="space-y-2 text-sm text-slate-200">
      <p>
        🎯 <strong>Chance:</strong>{" "}
        {predictions[item.id].closing_chance}%
      </p>

      <p>
        ⚠️ <strong>Risco:</strong>{" "}
        {predictions[item.id].risk_level}
      </p>

      <p>
        📲 <strong>Canal:</strong>{" "}
        {predictions[item.id].best_channel}
      </p>

      <p>
        🚀 <strong>Próxima ação:</strong>{" "}
        {predictions[item.id].next_action}
      </p>

      {predictions[item.id].best_approach && (
        <p className="text-slate-400">
          <strong>Abordagem:</strong>{" "}
          {predictions[item.id].best_approach}
        </p>
      )}
    </div>
  </div>
)}


                      </div>

                      <div className="grid grid-cols-1 gap-2 mt-5">

                        {item.phone && (

                          <a
                            href={`https://wa.me/55${item.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-xl text-sm font-bold text-center"
                          >
                            WhatsApp
                          </a>

                        )}

                        <select
                          value={item.current_stage}
                          onChange={(e) =>
                            moveStage(
                              item,
                              e.target.value
                            )
                          }
                          className="w-full bg-slate-900 p-2 rounded-xl outline-none text-sm"
                        >

                          {stages.map(stageOption => (

                            <option
                              key={stageOption}
                              value={stageOption}
                            >
                              {stageOption}
                            </option>

                          ))}

                        </select>

<button
  onClick={() =>
    predictLead(item)
  }
  disabled={
    predictingId === item.id
  }
  className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded-xl font-bold text-sm disabled:opacity-50"
>
  {predictingId === item.id
    ? "Analisando..."
    : "Análise IA"}
</button>

                        <button
  onClick={() =>
    generateStageMessage(item)
  }
  disabled={
    generatingAI === item.id
  }
  className="
    w-full
    bg-purple-600
    hover:bg-purple-700
    p-2
    rounded-xl
    font-bold
    text-sm
  "
>
  {
    generatingAI === item.id
      ? "Gerando..."
      : "IA Próxima Ação"
  }
</button>

                        <button
                          onClick={() =>
                            deleteItem(item.id)
                          }
                          className="w-full bg-red-600 hover:bg-red-700 p-2 rounded-xl font-bold text-sm"
                        >
                          Remover
                        </button>

                      </div>

                    </div>

                  ))}

                  {stageItems.length === 0 && (

                    <div className="text-center text-slate-500 py-20 text-sm border border-dashed border-slate-700 rounded-2xl">
                      Arraste um lead para esta etapa.
                    </div>

                  )}

                </div>

              </div>

            )

          })}

        </div>

      </div>

    </div>

  )

}