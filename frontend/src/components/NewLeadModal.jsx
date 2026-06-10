import { useEffect, useState } from "react"
import api from "../services/api"

const initialForm = {
  company_name: "",
  responsible: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  address: "",
  city: "",
  interest: "",
  notes: "",
  current_motorcycle: "",
  motorcycle_year: "",
  mileage: "",
  professional_use: false,
  lead_source: "Manual",
  purchase_timeline: "Sem previsão"
}

export default function NewLeadModal({
  open,
  onClose,
  onSuccess,
  leadToEdit = null
}) {
  const [form, setForm] = useState(initialForm)
  const [duplicateLead, setDuplicateLead] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
  if (leadToEdit) {
    setForm({
      company_name: leadToEdit.company_name || "",
      responsible: leadToEdit.responsible || "",
      phone: leadToEdit.phone || "",
      whatsapp: leadToEdit.whatsapp || "",
      instagram: leadToEdit.instagram || "",
      address: leadToEdit.address || "",
      city: leadToEdit.city || "",
      interest: leadToEdit.interest || "",
      notes: leadToEdit.notes || "",
      current_motorcycle: leadToEdit.current_motorcycle || "",
      motorcycle_year: leadToEdit.motorcycle_year || "",
      mileage: leadToEdit.mileage || "",
      professional_use: leadToEdit.professional_use || false,
      lead_source: leadToEdit.lead_source || "Manual",
      purchase_timeline: leadToEdit.purchase_timeline || "Sem previsão"
    })
  } else {
    setForm(initialForm)
  }
}, [leadToEdit, open])

  function updateField(field, value) {
    setForm({
      ...form,
      [field]: value
    })
  }

  function resetModal() {
    setDuplicateLead(null)
    setForm(initialForm)
  }

  function closeModal() {
    resetModal()
    onClose()
  }

  async function saveLead() {
  try {
    setLoading(true)
    setDuplicateLead(null)

    const payload = {
      ...form,
      mileage:
        form.mileage
          ? Number(form.mileage)
          : null,
      motorcycle_year:
        form.motorcycle_year
          ? Number(form.motorcycle_year)
          : null,
      status:
        leadToEdit?.status || "Novo Lead"
    }

    if (leadToEdit) {
      await api.put(
        `/leads/${leadToEdit.id}`,
        payload
      )

      alert("Lead atualizado com sucesso!")
    } else {
      await api.post("/leads", {
        ...payload,
        priority: "Média"
      })
    }

    onSuccess()
    closeModal()

  } catch (err) {
    if (
      err.response?.status === 409 &&
      err.response?.data?.error === "DUPLICATE_LEAD"
    ) {
      setDuplicateLead(err.response.data.lead)
      return
    }

    console.log(err)
    alert("Erro ao salvar lead")

  } finally {
    setLoading(false)
  }
}

  async function atualizarLeadAntigo() {
    if (!duplicateLead) return

    try {
      setLoading(true)

      await api.put(
        `/leads/${duplicateLead.id}`,
        {
          ...form,
          mileage: form.mileage ? Number(form.mileage) : null,
          motorcycle_year: form.motorcycle_year ? Number(form.motorcycle_year) : null,
          status: duplicateLead.status || "Novo Lead",
          priority: duplicateLead.priority || "Média"
        }
      )

      alert("Lead antigo atualizado com sucesso!")

      onSuccess()
      closeModal()

    } catch (err) {
      console.log(err)
      alert("Erro ao atualizar lead")

    } finally {
      setLoading(false)
    }
  }

  async function excluirAntigoECriarNovo() {
    if (!duplicateLead) return

    const confirmDelete =
      window.confirm(
        "Tem certeza que deseja excluir o lead antigo e criar este novo?"
      )

    if (!confirmDelete) return

    try {
      setLoading(true)

      await api.delete(`/leads/${duplicateLead.id}`)

      await api.post("/leads", {
        ...form,
        mileage: form.mileage ? Number(form.mileage) : null,
        motorcycle_year: form.motorcycle_year ? Number(form.motorcycle_year) : null,
        status: "Novo Lead",
        priority: "Média"
      })

      alert("Lead antigo excluído e novo lead criado com sucesso!")

      onSuccess()
      closeModal()

    } catch (err) {
      console.log(err)
      alert("Erro ao excluir e recriar lead")

    } finally {
      setLoading(false)
    }
  }

  function verLeadExistente() {
    if (!duplicateLead) return

    localStorage.setItem(
      "crmSearch",
      duplicateLead.company_name
    )

    closeModal()
    window.location.href = "/crm"
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-900 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-6">
          {leadToEdit ? "Editar Lead" : "Novo Lead"}
        </h2>

        {duplicateLead && (
          <div className="bg-yellow-500/10 border border-yellow-500 rounded-2xl p-4 mb-6">
            <h3 className="text-yellow-400 font-bold text-lg">
              Lead duplicado encontrado
            </h3>

            <p className="text-slate-300 mt-2">
              Já existe um lead cadastrado parecido com este:
            </p>

            <div className="bg-slate-800 rounded-xl p-4 mt-4">
              <p className="font-bold text-white">
                {duplicateLead.company_name}
              </p>

              <p className="text-slate-400 text-sm">
                Cidade: {duplicateLead.city || "Não informada"}
              </p>

              <p className="text-slate-400 text-sm">
                Telefone: {duplicateLead.phone || "Não informado"}
              </p>

              <p className="text-slate-400 text-sm">
                Status: {duplicateLead.status || "Sem status"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <button
                onClick={verLeadExistente}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 p-3 rounded-xl font-bold disabled:opacity-50"
              >
                Ver Lead
              </button>

              <button
                onClick={atualizarLeadAntigo}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 p-3 rounded-xl font-bold disabled:opacity-50"
              >
                Atualizar Antigo
              </button>

              <button
                onClick={excluirAntigoECriarNovo}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 p-3 rounded-xl font-bold disabled:opacity-50"
              >
                Excluir e Criar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <input
            placeholder="Empresa"
            value={form.company_name}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            onChange={(e) =>
              updateField("company_name", e.target.value)
            }
          />

          <input
            placeholder="Responsável"
            value={form.responsible}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            onChange={(e) =>
              updateField("responsible", e.target.value)
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Telefone"
              value={form.phone}
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
              onChange={(e) =>
                updateField("phone", e.target.value)
              }
            />

            <input
              placeholder="WhatsApp"
              value={form.whatsapp}
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
              onChange={(e) =>
                updateField("whatsapp", e.target.value)
              }
            />
          </div>

          <input
            placeholder="Instagram"
            value={form.instagram}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            onChange={(e) =>
              updateField("instagram", e.target.value)
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Cidade"
              value={form.city}
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
              onChange={(e) =>
                updateField("city", e.target.value)
              }
            />

            <input
              placeholder="Endereço"
              value={form.address}
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
              onChange={(e) =>
                updateField("address", e.target.value)
              }
            />
          </div>

          <input
            placeholder="Interesse"
            value={form.interest}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            onChange={(e) =>
              updateField("interest", e.target.value)
            }
          />

          <div className="border border-slate-800 rounded-2xl p-4 mt-6">
            <h3 className="font-bold mb-4">
              Dados para Score Inteligente
            </h3>

            <div className="space-y-4">
              <input
                placeholder="Moto atual"
                value={form.current_motorcycle}
                className="w-full bg-slate-800 p-3 rounded-xl outline-none"
                onChange={(e) =>
                  updateField("current_motorcycle", e.target.value)
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  placeholder="Ano da moto"
                  type="number"
                  value={form.motorcycle_year}
                  className="w-full bg-slate-800 p-3 rounded-xl outline-none"
                  onChange={(e) =>
                    updateField("motorcycle_year", e.target.value)
                  }
                />

                <input
                  placeholder="KM atual"
                  type="number"
                  value={form.mileage}
                  className="w-full bg-slate-800 p-3 rounded-xl outline-none"
                  onChange={(e) =>
                    updateField("mileage", e.target.value)
                  }
                />
              </div>

              <label className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl">
                <input
                  type="checkbox"
                  checked={form.professional_use}
                  onChange={(e) =>
                    updateField("professional_use", e.target.checked)
                  }
                />

                <span>
                  Usa a moto para trabalho
                </span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={form.lead_source}
                  className="w-full bg-slate-800 p-3 rounded-xl outline-none"
                  onChange={(e) =>
                    updateField("lead_source", e.target.value)
                  }
                >
                  <option value="Manual">Manual</option>
                  <option value="Radar de Oportunidades">Radar de Oportunidades</option>
                  <option value="Marketplace">Marketplace</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Loja">Loja</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Empresa">Empresa</option>
                  <option value="Auto escola">Auto escola</option>
                  <option value="Oficina">Oficina</option>
                </select>

                <select
                  value={form.purchase_timeline}
                  className="w-full bg-slate-800 p-3 rounded-xl outline-none"
                  onChange={(e) =>
                    updateField("purchase_timeline", e.target.value)
                  }
                >
                  <option value="Imediato">Imediato</option>
                  <option value="Até 30 dias">Até 30 dias</option>
                  <option value="Até 90 dias">Até 90 dias</option>
                  <option value="6 meses">6 meses</option>
                  <option value="Sem previsão">Sem previsão</option>
                </select>
              </div>
            </div>
          </div>

          <textarea
            placeholder="Observações"
            value={form.notes}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none min-h-28"
            onChange={(e) =>
              updateField("notes", e.target.value)
            }
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={saveLead}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 p-3 rounded-xl font-bold disabled:opacity-50"
          >
            {loading
  ? "Salvando..."
  : leadToEdit
    ? "Atualizar Lead"
    : "Salvar"}
          </button>

          <button
            onClick={closeModal}
            disabled={loading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 p-3 rounded-xl font-bold disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}