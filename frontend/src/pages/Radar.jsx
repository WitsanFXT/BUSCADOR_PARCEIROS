import { useEffect, useState } from "react"
import api from "../services/api"

export default function Radar() {

  const [opportunities, setOpportunities] =
    useState([])

  const [form, setForm] =
    useState({
      name: "",
      source: "Marketplace",
      city: "",
      category: "Motoboy",
      phone: "",
      instagram: "",
      current_motorcycle: "",
      motorcycle_year: "",
      mileage: "",
      professional_use: false,
      purchase_timeline: "Imediata",
      notes: ""
    })

  useEffect(() => {
    loadOpportunities()
  }, [])

  async function loadOpportunities() {

    try {

      const response =
        await api.get("/opportunities")

      setOpportunities(response.data)

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

  async function createOpportunity() {

    try {

      if (!form.name.trim()) {
        alert("Informe o nome da oportunidade")
        return
      }

      await api.post(
        "/opportunities",
        {
          ...form,
          motorcycle_year:
            form.motorcycle_year
              ? Number(form.motorcycle_year)
              : null,
          mileage:
            form.mileage
              ? Number(form.mileage)
              : null
        }
      )

      setForm({
        name: "",
        source: "Marketplace",
        city: "",
        category: "Motoboy",
        phone: "",
        instagram: "",
        current_motorcycle: "",
        motorcycle_year: "",
        mileage: "",
        professional_use: false,
        purchase_timeline: "Imediata",
        notes: ""
      })

      loadOpportunities()

    } catch (err) {

      console.log(err.response?.data || err)
      alert("Erro ao criar oportunidade")

    }

  }

  async function sendToCRM(id) {

    try {

      await api.post(
        `/opportunities/${id}/to-lead`
      )

      alert("Oportunidade enviada para o CRM!")

      loadOpportunities()

    } catch (err) {

      console.log(err)
      alert("Erro ao enviar para CRM")

    }

  }

  async function deleteOpportunity(id) {

  const confirmDelete =
    window.confirm(
      "Deseja excluir esta oportunidade?"
    )

  if (!confirmDelete) return

  try {

    await api.delete(
      `/opportunities/${id}`
    )

    loadOpportunities()

  } catch (err) {

    console.log(err)
    alert("Erro ao excluir oportunidade")

  }

}

  function getTemperature(score) {

    if (score >= 70) {
      return {
        label: "Quente",
        className: "bg-green-600"
      }
    }

    if (score >= 40) {
      return {
        label: "Morno",
        className: "bg-yellow-500"
      }
    }

    return {
      label: "Frio",
      className: "bg-red-600"
    }

  }

  function getTradeLabel(probability) {

    if (probability >= 80) {
      return "Alta chance de troca"
    }

    if (probability >= 50) {
      return "Chance média de troca"
    }

    return "Baixa chance de troca"

  }

  function generateMessage(item) {

    const category =
      item.category || "profissional"

    const city =
      item.city || "região"

    const motorcycle =
      item.current_motorcycle
        ? ` e atualmente utiliza uma ${item.current_motorcycle}`
        : ""

    const use =
      item.professional_use
        ? " no trabalho"
        : ""

    return `Olá, tudo bem? Vi que você atua como ${category} em ${city}${motorcycle}${use}. Sou consultor Yamaha e estou ajudando pessoas da região a avaliarem possibilidades de troca por uma moto 0km com parcelas acessíveis. Posso fazer uma simulação sem compromisso para você?`

  }

  function copyMessage(item) {

    navigator.clipboard.writeText(
      generateMessage(item)
    )

    alert("Mensagem copiada!")

  }

  const hot =
    opportunities.filter(item =>
      item.score >= 70
    ).length

  const warm =
    opportunities.filter(item =>
      item.score >= 40 &&
      item.score < 70
    ).length

  const cold =
    opportunities.filter(item =>
      item.score < 40
    ).length

  const highTrade =
    opportunities.filter(item =>
      item.trade_probability >= 80
    ).length

  return (

    <div className="space-y-6 text-white">

      <div>

        <h1 className="text-4xl font-bold">
          Radar de Oportunidades
        </h1>

        <p className="text-slate-400 mt-2">
          Identifique quem tem maior chance de trocar de moto nos próximos meses.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-green-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Leads Quentes
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {hot}
          </h2>
        </div>

        <div className="bg-yellow-500 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Leads Mornos
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {warm}
          </h2>
        </div>

        <div className="bg-red-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Leads Frios
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {cold}
          </h2>
        </div>

        <div className="bg-blue-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Alta Chance de Troca
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {highTrade}
          </h2>
        </div>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <h2 className="text-2xl font-bold mb-5">
          Nova Oportunidade
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          <input
            placeholder="Nome / Empresa"
            value={form.name}
            onChange={(e) =>
              updateField("name", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <select
            value={form.source}
            onChange={(e) =>
              updateField("source", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          >
            <option>Marketplace</option>
            <option>Facebook</option>
            <option>Instagram</option>
            <option>Indicação</option>
            <option>Empresa</option>
            <option>Google Maps</option>
            <option>Manual</option>
          </select>

          <select
            value={form.category}
            onChange={(e) =>
              updateField("category", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          >
            <option>Motoboy</option>
            <option>Entregador</option>
            <option>Mototáxi</option>
            <option>Delivery</option>
            <option>Oficina</option>
            <option>Moto Peças</option>
            <option>Borracharia</option>
            <option>Auto Escola</option>
            <option>Empresa</option>
            <option>Fazenda</option>
            <option>Pessoa Física</option>
          </select>

          <input
            placeholder="Cidade"
            value={form.city}
            onChange={(e) =>
              updateField("city", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <input
            placeholder="WhatsApp / Telefone"
            value={form.phone}
            onChange={(e) =>
              updateField("phone", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <input
            placeholder="Instagram"
            value={form.instagram}
            onChange={(e) =>
              updateField("instagram", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <input
            placeholder="Moto atual. Ex: Factor 2017"
            value={form.current_motorcycle}
            onChange={(e) =>
              updateField("current_motorcycle", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <input
            type="number"
            placeholder="Ano da moto"
            value={form.motorcycle_year}
            onChange={(e) =>
              updateField("motorcycle_year", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <input
            type="number"
            placeholder="Quilometragem"
            value={form.mileage}
            onChange={(e) =>
              updateField("mileage", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          />

          <select
            value={form.purchase_timeline}
            onChange={(e) =>
              updateField("purchase_timeline", e.target.value)
            }
            className="bg-slate-800 p-3 rounded-xl outline-none"
          >
            <option>Imediata</option>
            <option>Até 30 dias</option>
            <option>Em 3 meses</option>
            <option>Em 6 meses ou mais</option>
            <option>Sem previsão</option>
          </select>

          <label className="bg-slate-800 p-3 rounded-xl flex items-center gap-3">

            <input
              type="checkbox"
              checked={form.professional_use}
              onChange={(e) =>
                updateField("professional_use", e.target.checked)
              }
            />

            Usa moto para trabalho

          </label>

        </div>

        <textarea
          placeholder="Observações: exemplo, anunciou uma Factor 2018, trabalha com entregas, quer trocar de moto..."
          value={form.notes}
          onChange={(e) =>
            updateField("notes", e.target.value)
          }
          className="w-full bg-slate-800 p-3 rounded-xl outline-none mt-4 min-h-24"
        />

        <button
          onClick={createOpportunity}
          className="mt-4 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold"
        >
          Cadastrar Oportunidade
        </button>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <h2 className="text-2xl font-bold mb-5">
          Oportunidades Encontradas
        </h2>

        <div className="space-y-4">

          {opportunities.map(item => {

            const temp =
              getTemperature(item.score)

            return (

              <div
                key={item.id}
                className="bg-slate-800 rounded-2xl p-5"
              >

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="text-xl font-bold">
                        {item.name}
                      </h3>

                      <span className={`${temp.className} px-3 py-1 rounded-full text-xs font-bold`}>
                        {temp.label}
                      </span>

                      <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                        {item.trade_probability || 0}% troca
                      </span>

                    </div>

                    <p className="text-slate-400 mt-2">
                      {item.source} • {item.category} • {item.city || "Sem cidade"}
                    </p>

                    <p className="text-slate-300 text-sm mt-2">
                      {getTradeLabel(item.trade_probability || 0)}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-slate-400">

                      <p>
                        Moto atual: {item.current_motorcycle || "-"}
                      </p>

                      <p>
                        Ano: {item.motorcycle_year || "-"}
                      </p>

                      <p>
                        KM: {item.mileage || "-"}
                      </p>

                      <p>
                        Uso profissional: {item.professional_use ? "Sim" : "Não"}
                      </p>

                      <p>
                        Prazo: {item.purchase_timeline || "-"}
                      </p>

                      <p>
                        Score: {item.score}
                      </p>

                    </div>

                    {item.notes && (
                      <p className="text-slate-300 mt-3">
                        {item.notes}
                      </p>
                    )}

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">

                    <button
                      onClick={() =>
                        copyMessage(item)
                      }
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-bold"
                    >
                      Copiar Abordagem
                    </button>

                    <button
                     onClick={() =>
                        deleteOpportunity(item.id)
                     }
                     className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl font-bold"
                    >
                    Excluir
                    </button>

                    <button
                      onClick={() =>
                        sendToCRM(item.id)
                      }
                      className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-bold"
                    >
                      Enviar ao CRM
                    </button>

                    {item.phone ? (
                      <a
                        href={`https://wa.me/55${item.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl font-bold text-center"
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

                    <button
                        onClick={() =>
                            deleteOpportunity(item.id)
                        }
                    className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl font-bold"
                    >
                    Excluir
                    </button>

                  </div>

                </div>

              </div>

            )

          })}

          {opportunities.length === 0 && (

            <div className="text-center text-slate-400 py-10">
              Nenhuma oportunidade cadastrada ainda.
            </div>

          )}

        </div>

      </div>

    </div>

  )

}