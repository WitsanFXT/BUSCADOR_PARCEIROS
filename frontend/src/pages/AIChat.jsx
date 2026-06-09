import { useState } from "react"
import api from "../services/api"

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Olá, sou a MotoLead AI. Me pergunte quem atacar hoje, como recuperar um lead, ou peça uma mensagem pronta para WhatsApp."
    }
  ])

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage = input

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        content: userMessage
      }
    ])

    setInput("")
    setLoading(true)

    try {
      const response =
        await api.post("/assistant/chat", {
          message: userMessage
        })

      const data =
        response.data

      const answer =
        data.answer ||
        data.message ||
        data.advice ||
        "Não consegui gerar uma resposta agora."

      const actions =
        data.suggested_actions?.length
          ? `\n\nAções sugeridas:\n${data.suggested_actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`
          : ""

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `${answer}${actions}`
        }
      ])

    } catch (err) {
      console.log(err)

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content:
            "Tive um problema para responder agora. Verifique o backend ou a configuração da IA."
        }
      ])

    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="text-white h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-4xl font-bold">
          Chat da Assistente IA
        </h1>

        <p className="text-slate-400 mt-2">
          Converse com a MotoLead AI como uma gestora comercial.
        </p>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-3xl rounded-2xl p-4 whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-200"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-slate-400">
            MotoLead AI pensando...
          </div>
        )}
      </div>

      <div className="mt-4 bg-slate-900 border border-slate-800 rounded-3xl p-4">
        <textarea
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Pergunte: Quem devo atacar hoje? Crie uma mensagem para Gustavo. Me dê uma ideia de conteúdo..."
          className="w-full bg-slate-800 rounded-2xl p-4 outline-none min-h-24"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="mt-3 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}