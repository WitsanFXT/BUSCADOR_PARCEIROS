import { useState } from "react"
import api from "../services/api"

export default function NewLeadModal({
  open,
  onClose,
  onSuccess
}) {

  const [form, setForm] =
    useState({
      company_name: "",
      responsible: "",
      phone: "",
      whatsapp: "",
      instagram: "",
      address: "",
      city: "",
      interest: "",
      notes: ""
    })

  const [duplicateLead, setDuplicateLead] =
    useState(null)

  const [loading, setLoading] =
    useState(false)

  function updateField(field, value) {

    setForm({
      ...form,
      [field]: value
    })

  }

  function resetModal() {

    setDuplicateLead(null)

    setForm({
      company_name: "",
      responsible: "",
      phone: "",
      whatsapp: "",
      instagram: "",
      address: "",
      city: "",
      interest: "",
      notes: ""
    })

  }

  function closeModal() {

    resetModal()
    onClose()

  }

  async function saveLead() {

    try {

      setLoading(true)
      setDuplicateLead(null)

      await api.post("/leads", {
        ...form,
        status: "Novo Lead",
        priority: "Média"
      })

      onSuccess()
      closeModal()

    } catch (err) {

      if (
        err.response?.status === 409 &&
        err.response?.data?.error === "DUPLICATE_LEAD"
      ) {

        setDuplicateLead(
          err.response.data.lead
        )

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
          status:
            duplicateLead.status || "Novo Lead",
          priority:
            duplicateLead.priority || "Média"
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

      await api.delete(
        `/leads/${duplicateLead.id}`
      )

      await api.post("/leads", {
        ...form,
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

      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl p-6 text-white">

        <h2 className="text-2xl font-bold mb-6">
          Novo Lead
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
              updateField(
                "company_name",
                e.target.value
              )
            }
          />

          <input
            placeholder="Responsável"
            value={form.responsible}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            onChange={(e) =>
              updateField(
                "responsible",
                e.target.value
              )
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              placeholder="Telefone"
              value={form.phone}
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
              onChange={(e) =>
                updateField(
                  "phone",
                  e.target.value
                )
              }
            />

            <input
              placeholder="WhatsApp"
              value={form.whatsapp}
              className="w-full bg-slate-800 p-3 rounded-xl outline-none"
              onChange={(e) =>
                updateField(
                  "whatsapp",
                  e.target.value
                )
              }
            />

          </div>

          <input
            placeholder="Instagram"
            value={form.instagram}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            onChange={(e) =>
              updateField(
                "instagram",
                e.target.value
              )
            }
          />

          <input
            placeholder="Endereço"
            value={form.address}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            onChange={(e) =>
              updateField(
                "address",
                e.target.value
              )
            }
          />

          <input
            placeholder="Cidade"
            value={form.city}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            onChange={(e) =>
              updateField(
                "city",
                e.target.value
              )
            }
          />

          <input
            placeholder="Interesse"
            value={form.interest}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none"
            onChange={(e) =>
              updateField(
                "interest",
                e.target.value
              )
            }
          />

          <textarea
            placeholder="Observações"
            value={form.notes}
            className="w-full bg-slate-800 p-3 rounded-xl outline-none min-h-28"
            onChange={(e) =>
              updateField(
                "notes",
                e.target.value
              )
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