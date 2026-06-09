import { useEffect, useState } from "react"
import api from "../services/api"

export default function Referrals() {

  const [partners, setPartners] =
    useState([])

  const [referrals, setReferrals] =
    useState([])

  const [partnerForm, setPartnerForm] =
    useState({
      name: "",
      type: "Oficina",
      city: "",
      phone: "",
      instagram: "",
      commission_value: 150,
      notes: ""
    })

  const [referralForm, setReferralForm] =
    useState({
      partner_id: "",
      customer_name: "",
      customer_phone: "",
      motorcycle_interest: "",
      notes: ""
    })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {

    try {

      const [partnersResponse, referralsResponse] =
        await Promise.all([
          api.get("/referrals/partners"),
          api.get("/referrals")
        ])

      setPartners(partnersResponse.data)
      setReferrals(referralsResponse.data)

    } catch (err) {

      console.log(err)

    }

  }

  function updatePartner(field, value) {

    setPartnerForm({
      ...partnerForm,
      [field]: value
    })

  }

  function updateReferral(field, value) {

    setReferralForm({
      ...referralForm,
      [field]: value
    })

  }

  async function createPartner() {

    if (!partnerForm.name.trim()) {
      alert("Informe o nome do indicador")
      return
    }

    try {

      await api.post(
        "/referrals/partners",
        {
          ...partnerForm,
          commission_value:
            Number(partnerForm.commission_value || 150)
        }
      )

      setPartnerForm({
        name: "",
        type: "Oficina",
        city: "",
        phone: "",
        instagram: "",
        commission_value: 150,
        notes: ""
      })

      loadData()

    } catch (err) {

      console.log(err)
      alert("Erro ao cadastrar indicador")

    }

  }

  async function createReferral() {

    if (!referralForm.partner_id) {
      alert("Selecione o indicador")
      return
    }

    if (!referralForm.customer_name.trim()) {
      alert("Informe o nome do cliente indicado")
      return
    }

    try {

      await api.post(
        "/referrals",
        referralForm
      )

      setReferralForm({
        partner_id: "",
        customer_name: "",
        customer_phone: "",
        motorcycle_interest: "",
        notes: ""
      })

      loadData()

    } catch (err) {

      console.log(err)
      alert("Erro ao registrar indicação")

    }

  }

  async function updateReferralStatus(id, status) {

    try {

      await api.put(
        `/referrals/${id}`,
        {
          status
        }
      )

      loadData()

    } catch (err) {

      console.log(err)
      alert("Erro ao atualizar indicação")

    }

  }

  async function toggleCommission(id, value) {

    try {

      await api.put(
        `/referrals/${id}`,
        {
          commission_paid: value
        }
      )

      loadData()

    } catch (err) {

      console.log(err)
      alert("Erro ao atualizar comissão")

    }

  }

  async function sendToCRM(id) {

    try {

      await api.post(
        `/referrals/${id}/to-lead`
      )

      alert("Indicação enviada para o CRM!")

      loadData()

    } catch (err) {

      console.log(err)
      alert("Erro ao enviar para CRM")

    }

  }

  function getPartnerStats(partnerId) {

    const partnerReferrals =
      referrals.filter(item =>
        item.partner_id === partnerId
      )

    const sales =
      partnerReferrals.filter(item =>
        item.status === "Venda realizada"
      )

    const pendingCommission =
      sales.filter(item =>
        !item.commission_paid
      )

    const partner =
      partners.find(item =>
        item.id === partnerId
      )

    const commissionValue =
      Number(partner?.commission_value || 150)

    return {
      total: partnerReferrals.length,
      sales: sales.length,
      pendingCommission:
        pendingCommission.length * commissionValue
    }

  }

  const totalReferrals =
    referrals.length

  const totalSales =
    referrals.filter(item =>
      item.status === "Venda realizada"
    ).length

  const totalPendingCommission =
    referrals.reduce((sum, item) => {

      if (
        item.status !== "Venda realizada" ||
        item.commission_paid
      ) {
        return sum
      }

      const commission =
        Number(
          item.referral_partners?.commission_value || 150
        )

      return sum + commission

    }, 0)

  return (

    <div className="space-y-6 text-white">

      <div>

        <h1 className="text-4xl font-bold">
          Sistema de Indicações
        </h1>

        <p className="text-slate-400 mt-2">
          Cadastre parceiros locais, acompanhe indicações e controle comissões.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-blue-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Indicações Recebidas
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {totalReferrals}
          </h2>
        </div>

        <div className="bg-green-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Vendas por Indicação
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {totalSales}
          </h2>
        </div>

        <div className="bg-yellow-500 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Comissão Pendente
          </p>
          <h2 className="text-4xl font-bold mt-2">
            R$ {totalPendingCommission}
          </h2>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <h2 className="text-2xl font-bold mb-5">
            Cadastrar Indicador
          </h2>

          <div className="space-y-4">

            <input
              placeholder="Nome do parceiro"
              value={partnerForm.name}
              onChange={(e) =>
                updatePartner("name", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            />

            <select
              value={partnerForm.type}
              onChange={(e) =>
                updatePartner("type", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            >
              <option>Oficina</option>
              <option>Borracharia</option>
              <option>Moto Peças</option>
              <option>Despachante</option>
              <option>Mototáxi</option>
              <option>Cliente</option>
              <option>Empresa</option>
              <option>Outro</option>
            </select>

            <input
              placeholder="Cidade"
              value={partnerForm.city}
              onChange={(e) =>
                updatePartner("city", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            />

            <input
              placeholder="Telefone / WhatsApp"
              value={partnerForm.phone}
              onChange={(e) =>
                updatePartner("phone", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            />

            <input
              placeholder="Instagram"
              value={partnerForm.instagram}
              onChange={(e) =>
                updatePartner("instagram", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            />

            <input
              type="number"
              placeholder="Comissão por venda"
              value={partnerForm.commission_value}
              onChange={(e) =>
                updatePartner("commission_value", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            />

            <textarea
              placeholder="Observações"
              value={partnerForm.notes}
              onChange={(e) =>
                updatePartner("notes", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none min-h-24"
            />

            <button
              onClick={createPartner}
              className="w-full bg-red-600 hover:bg-red-700 p-3 rounded-xl font-bold"
            >
              Cadastrar Indicador
            </button>

          </div>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <h2 className="text-2xl font-bold mb-5">
            Registrar Indicação
          </h2>

          <div className="space-y-4">

            <select
              value={referralForm.partner_id}
              onChange={(e) =>
                updateReferral("partner_id", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            >
              <option value="">
                Selecione o indicador
              </option>

              {partners.map(partner => (
                <option
                  key={partner.id}
                  value={partner.id}
                >
                  {partner.name} - {partner.type}
                </option>
              ))}

            </select>

            <input
              placeholder="Nome do cliente indicado"
              value={referralForm.customer_name}
              onChange={(e) =>
                updateReferral("customer_name", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            />

            <input
              placeholder="Telefone do cliente"
              value={referralForm.customer_phone}
              onChange={(e) =>
                updateReferral("customer_phone", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            />

            <input
              placeholder="Interesse. Ex: Factor, Crosser, Fazer"
              value={referralForm.motorcycle_interest}
              onChange={(e) =>
                updateReferral("motorcycle_interest", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            />

            <textarea
              placeholder="Observações"
              value={referralForm.notes}
              onChange={(e) =>
                updateReferral("notes", e.target.value)
              }
              className="w-full bg-slate-800 p-3 rounded-xl outline-none min-h-24"
            />

            <button
              onClick={createReferral}
              className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-xl font-bold"
            >
              Registrar Indicação
            </button>

          </div>

        </div>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <h2 className="text-2xl font-bold mb-5">
          Ranking de Indicadores
        </h2>

        <div className="space-y-4">

          {partners.map(partner => {

            const stats =
              getPartnerStats(partner.id)

            return (

              <div
                key={partner.id}
                className="bg-slate-800 rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
              >

                <div>

                  <h3 className="text-xl font-bold">
                    {partner.name}
                  </h3>

                  <p className="text-slate-400">
                    {partner.type} • {partner.city || "Sem cidade"}
                  </p>

                  <p className="text-slate-500 text-sm mt-1">
                    Comissão: R$ {partner.commission_value || 150}
                  </p>

                </div>

                <div className="grid grid-cols-3 gap-3 text-center">

                  <div className="bg-slate-900 p-3 rounded-xl">
                    <p className="text-2xl font-bold">
                      {stats.total}
                    </p>
                    <p className="text-xs text-slate-400">
                      Indicações
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl">
                    <p className="text-2xl font-bold">
                      {stats.sales}
                    </p>
                    <p className="text-xs text-slate-400">
                      Vendas
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl">
                    <p className="text-2xl font-bold">
                      R$ {stats.pendingCommission}
                    </p>
                    <p className="text-xs text-slate-400">
                      Pendente
                    </p>
                  </div>

                </div>

              </div>

            )

          })}

        </div>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <h2 className="text-2xl font-bold mb-5">
          Indicações
        </h2>

        <div className="space-y-4">

          {referrals.map(item => (

            <div
              key={item.id}
              className="bg-slate-800 rounded-2xl p-5"
            >

              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

                <div>

                  <h3 className="text-xl font-bold">
                    {item.customer_name}
                  </h3>

                  <p className="text-slate-400">
                    Indicado por: {item.referral_partners?.name || "Não informado"}
                  </p>

                  <p className="text-slate-400 text-sm mt-1">
                    Interesse: {item.motorcycle_interest || "-"}
                  </p>

                  <p className="text-slate-500 text-sm mt-1">
                    Status: {item.status}
                  </p>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">

                  <button
                    onClick={() =>
                      sendToCRM(item.id)
                    }
                    className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-bold"
                  >
                    Enviar CRM
                  </button>

                  <button
                    onClick={() =>
                      updateReferralStatus(
                        item.id,
                        "Venda realizada"
                      )
                    }
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-bold"
                  >
                    Venda
                  </button>

                  <button
                    onClick={() =>
                      toggleCommission(
                        item.id,
                        !item.commission_paid
                      )
                    }
                    className={
                      item.commission_paid
                        ? "bg-slate-600 hover:bg-slate-500 px-4 py-3 rounded-xl font-bold"
                        : "bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-xl font-bold"
                    }
                  >
                    {item.commission_paid
                      ? "Pago"
                      : "Pagar"}
                  </button>

                  {item.customer_phone ? (

                    <a
                      href={`https://wa.me/55${item.customer_phone.replace(/\D/g, "")}`}
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

                </div>

              </div>

            </div>

          ))}

          {referrals.length === 0 && (

            <div className="text-center text-slate-400 py-10">
              Nenhuma indicação registrada.
            </div>

          )}

        </div>

      </div>

    </div>

  )

}