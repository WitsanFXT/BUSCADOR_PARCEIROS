import {
  MessageCircle,
  Copy,
  MapPinned,
  CalendarClock
} from "lucide-react"

export default function Automation() {

  const leads = [
    {
      company: "Moto Peças Unaí",
      whatsapp: "https://wa.me/5538999991111",
      instagram: "https://instagram.com/motopecasunai",
      maps: "https://maps.google.com",
      message:
        "Olá, tudo bem? Trabalho na Yamaha e estamos abrindo parceria especial para empresas com condições diferenciadas em motos 0km."
    },
    {
      company: "Delivery Flash",
      whatsapp: "https://wa.me/5538988882222",
      instagram: "https://instagram.com/deliveryflash",
      maps: "https://maps.google.com",
      message:
        "Olá! Temos condições especiais para parceiros corporativos Yamaha com motos 0km."
    }
  ]

  const copyMessage = (message) => {
    navigator.clipboard.writeText(message)
    alert("Mensagem copiada!")
  }

  return (
    <div className="text-white">

      <h1 className="text-4xl font-bold mb-2">
        Automação Comercial
      </h1>

      <p className="text-slate-400 mb-10">
        Ferramentas rápidas para prospecção
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {leads.map((lead, index) => (

          <div
            key={index}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
          >

            <h2 className="text-2xl font-bold mb-4">
              {lead.company}
            </h2>

            <div className="bg-slate-800 p-4 rounded-2xl">

              <p className="text-slate-300 text-sm">
                {lead.message}
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">

              <a
                href={lead.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 hover:bg-green-700 transition p-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
              >

                <MessageCircle size={20} />

                WhatsApp

              </a>

              <button
                onClick={() => copyMessage(lead.message)}
                className="bg-blue-600 hover:bg-blue-700 transition p-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
              >

                <Copy size={20} />

                Copiar

              </button>

              <a
  href={lead.instagram}
  target="_blank"
  rel="noreferrer"
  className="bg-pink-600 hover:bg-pink-700 transition p-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
>

  📸 Instagram

</a>

              <a
                href={lead.maps}
                target="_blank"
                rel="noreferrer"
                className="bg-orange-600 hover:bg-orange-700 transition p-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
              >

                <MapPinned size={20} />

                Maps

              </a>

            </div>

            <button className="w-full mt-5 bg-slate-700 hover:bg-slate-600 transition p-4 rounded-2xl flex items-center justify-center gap-2 font-bold">

              <CalendarClock size={20} />

              Agendar Retorno

            </button>

          </div>

        ))}

      </div>

    </div>
  )
}