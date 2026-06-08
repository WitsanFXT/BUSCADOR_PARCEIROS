import { useEffect, useState } from "react"
import api from "../services/api"

export default function ContentCenter() {

  const [contents, setContents] =
    useState([])

  const [tab, setTab] =
    useState("todos")

  useEffect(() => {
    loadContents()
  }, [])

  async function loadContents() {

    try {

      const response =
        await api.get("/content")

      setContents(response.data)

    } catch (err) {

      console.log(err)

    }

  }

  async function generateWeek() {

    try {

      await api.post("/content/generate")

      loadContents()

    } catch (err) {

      console.log(err.response?.data || err)

alert(
  err.response?.data?.message ||
  err.response?.data?.error ||
  "Erro ao gerar conteúdos"
)

    }

  }

  async function updateStatus(id, status) {

    try {

      await api.put(
        `/content/${id}/status`,
        {
          status
        }
      )

      loadContents()

    } catch (err) {

      console.log(err)
      alert("Erro ao atualizar status")

    }

  }

  async function deleteContent(id) {

    const confirmDelete =
      window.confirm(
        "Deseja excluir esta ideia de conteúdo?"
      )

    if (!confirmDelete) return

    try {

      await api.delete(
        `/content/${id}`
      )

      loadContents()

    } catch (err) {

      console.log(err)
      alert("Erro ao excluir conteúdo")

    }

  }

  function copyText(text) {

    navigator.clipboard.writeText(text || "")

    alert("Texto copiado!")

  }

  function formatDate(date) {

    return new Date(date)
      .toLocaleDateString("pt-BR")

  }

  const filteredContents =
    contents.filter(item => {

      if (tab === "todos") return true
      return item.type === tab

    })

  const pending =
    contents.filter(item =>
      item.status === "Pendente"
    ).length

  const posted =
    contents.filter(item =>
      item.status === "Publicado"
    ).length

  return (

    <div className="space-y-6 text-white">

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

        <div>

          <h1 className="text-4xl font-bold">
            Central de Conteúdo
          </h1>

          <p className="text-slate-400 mt-2">
            Ideias, legendas e status para gerar demanda todos os dias.
          </p>

        </div>

        <button
          onClick={generateWeek}
          className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-bold"
        >
          Gerar Nova Semana
        </button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-blue-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Ideias Geradas
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {contents.length}
          </h2>
        </div>

        <div className="bg-yellow-500 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Pendentes
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {pending}
          </h2>
        </div>

        <div className="bg-green-600 rounded-3xl p-5">
          <p className="text-sm opacity-80">
            Publicados
          </p>
          <h2 className="text-4xl font-bold mt-2">
            {posted}
          </h2>
        </div>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

        <button
          onClick={() => setTab("todos")}
          className={
            tab === "todos"
              ? "bg-red-600 p-3 rounded-xl font-bold"
              : "bg-slate-800 p-3 rounded-xl font-bold hover:bg-slate-700"
          }
        >
          Todos
        </button>

        <button
          onClick={() => setTab("Vídeo")}
          className={
            tab === "Vídeo"
              ? "bg-red-600 p-3 rounded-xl font-bold"
              : "bg-slate-800 p-3 rounded-xl font-bold hover:bg-slate-700"
          }
        >
          Vídeos
        </button>

        <button
          onClick={() => setTab("Status WhatsApp")}
          className={
            tab === "Status WhatsApp"
              ? "bg-red-600 p-3 rounded-xl font-bold"
              : "bg-slate-800 p-3 rounded-xl font-bold hover:bg-slate-700"
          }
        >
          Status
        </button>

        <button
          onClick={() => setTab("Instagram")}
          className={
            tab === "Instagram"
              ? "bg-red-600 p-3 rounded-xl font-bold"
              : "bg-slate-800 p-3 rounded-xl font-bold hover:bg-slate-700"
          }
        >
          Instagram
        </button>

        <button
          onClick={() => setTab("Legenda")}
          className={
            tab === "Legenda"
              ? "bg-red-600 p-3 rounded-xl font-bold"
              : "bg-slate-800 p-3 rounded-xl font-bold hover:bg-slate-700"
          }
        >
          Legendas
        </button>

      </div>

      <div className="space-y-4">

        {filteredContents.map(item => (

          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
          >

            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">

              <div className="flex-1">

                <div className="flex flex-wrap items-center gap-3">

                  <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                    {item.type}
                  </span>

                  <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                    {item.theme}
                  </span>

                  <span className={
                    item.status === "Publicado"
                      ? "bg-green-600 px-3 py-1 rounded-full text-xs font-bold"
                      : "bg-yellow-500 px-3 py-1 rounded-full text-xs font-bold"
                  }>
                    {item.status}
                  </span>

                  <span className="text-slate-400 text-sm">
                    {formatDate(item.content_date)}
                  </span>

                </div>

                <h2 className="text-2xl font-bold mt-4">
                  {item.title}
                </h2>

                <div className="bg-slate-800 rounded-2xl p-4 mt-4">

                  <p className="text-slate-400 text-sm font-bold">
                    Roteiro / Ideia
                  </p>

                  <p className="text-slate-200 mt-2">
                    {item.script}
                  </p>

                </div>

                <div className="bg-slate-800 rounded-2xl p-4 mt-4">

                  <p className="text-slate-400 text-sm font-bold">
                    Legenda
                  </p>

                  <p className="text-slate-200 mt-2">
                    {item.caption}
                  </p>

                </div>

                <div className="bg-slate-800 rounded-2xl p-4 mt-4">

                  <p className="text-slate-400 text-sm font-bold">
                    Status WhatsApp
                  </p>

                  <p className="text-slate-200 mt-2">
                    {item.status_text}
                  </p>

                </div>

              </div>

              <div className="grid grid-cols-1 gap-3 min-w-[220px]">

                <button
                  onClick={() =>
                    copyText(item.caption)
                  }
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-bold"
                >
                  Copiar Legenda
                </button>

                <button
                  onClick={() =>
                    copyText(item.status_text)
                  }
                  className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-xl font-bold"
                >
                  Copiar Status
                </button>

                <button
                  onClick={() =>
                    copyText(item.script)
                  }
                  className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl font-bold"
                >
                  Copiar Roteiro
                </button>

                <button
                  onClick={() =>
                    updateStatus(
                      item.id,
                      item.status === "Publicado"
                        ? "Pendente"
                        : "Publicado"
                    )
                  }
                  className="bg-yellow-500 hover:bg-yellow-600 px-4 py-3 rounded-xl font-bold"
                >
                  {item.status === "Publicado"
                    ? "Marcar Pendente"
                    : "Marcar Publicado"}
                </button>

                <button
                  onClick={() =>
                    deleteContent(item.id)
                  }
                  className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl font-bold"
                >
                  Excluir
                </button>

              </div>

            </div>

          </div>

        ))}

        {filteredContents.length === 0 && (

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400">
            Nenhuma ideia encontrada.
          </div>

        )}

      </div>

    </div>

  )

}