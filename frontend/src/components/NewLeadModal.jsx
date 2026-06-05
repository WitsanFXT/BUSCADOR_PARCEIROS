import { useState } from "react"
import api from "../../../backend/src/services/api"

export default function NewLeadModal({
  open,
  onClose,
  onSuccess
}) {

  const [form, setForm] = useState({
    company_name: "",
    responsible: "",
    phone: "",
    city: "",
    notes: ""
  })

  async function saveLead() {

    try {

      await api.post("/leads", {
        ...form,
        status: "Novo Lead",
        priority: "Média"
      })

      onSuccess()

      onClose()

    } catch (err) {

      console.log(err)

      alert("Erro ao salvar lead")

    }

  }

  if (!open) return null

  return (

    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="bg-slate-900 w-full max-w-xl rounded-3xl p-6">

        <h2 className="text-2xl font-bold mb-6">
          Novo Lead
        </h2>

        <div className="space-y-4">

          <input
            placeholder="Empresa"
            className="w-full bg-slate-800 p-3 rounded-xl"
            onChange={(e) =>
              setForm({
                ...form,
                company_name: e.target.value
              })
            }
          />

          <input
            placeholder="Responsável"
            className="w-full bg-slate-800 p-3 rounded-xl"
            onChange={(e) =>
              setForm({
                ...form,
                responsible: e.target.value
              })
            }
          />

          <input
            placeholder="Telefone"
            className="w-full bg-slate-800 p-3 rounded-xl"
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value
              })
            }
          />

          <input
            placeholder="Cidade"
            className="w-full bg-slate-800 p-3 rounded-xl"
            onChange={(e) =>
              setForm({
                ...form,
                city: e.target.value
              })
            }
          />

          <textarea
            placeholder="Observações"
            className="w-full bg-slate-800 p-3 rounded-xl"
            onChange={(e) =>
              setForm({
                ...form,
                notes: e.target.value
              })
            }
          />

        </div>

        <div className="flex gap-3 mt-6">

          <button
            onClick={saveLead}
            className="flex-1 bg-green-600 p-3 rounded-xl font-bold"
          >
            Salvar
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 p-3 rounded-xl font-bold"
          >
            Cancelar
          </button>

        </div>

      </div>

    </div>

  )
}