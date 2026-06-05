import {
  Building2,
  MapPinned,
  PhoneCall,
  Handshake,
  Bike,
  Target
} from "lucide-react"

export default function Dashboard() {
  const cards = [
    {
      title: "Cidades Pesquisadas",
      value: "12",
      icon: <MapPinned size={28} />,
      color: "bg-blue-600"
    },
    {
      title: "Empresas Encontradas",
      value: "248",
      icon: <Building2 size={28} />,
      color: "bg-purple-600"
    },
    {
      title: "Contatos Feitos",
      value: "91",
      icon: <PhoneCall size={28} />,
      color: "bg-orange-500"
    },
    {
      title: "Parceiros Ativos",
      value: "23",
      icon: <Handshake size={28} />,
      color: "bg-green-600"
    },
    {
      title: "Motos Vendidas",
      value: "37",
      icon: <Bike size={28} />,
      color: "bg-red-500"
    },
    {
      title: "Meta do Mês",
      value: "74%",
      icon: <Target size={28} />,
      color: "bg-yellow-500"
    }
  ]

  return (
    <div className="text-white">

      {/* TOPO */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          Yamaha Partners CRM
        </h1>

        <p className="text-slate-400 mt-2">
          Sistema de prospecção de parceiros e vendas corporativas
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6">

        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg hover:scale-[1.02] transition"
          >

            <div className="flex items-center justify-between">

              <div>
                <p className="text-slate-400 text-sm">
                  {card.title}
                </p>

                <h2 className="text-4xl font-bold mt-3">
                  {card.value}
                </h2>
              </div>

              <div className={`${card.color} p-4 rounded-2xl`}>
                {card.icon}
              </div>

            </div>

          </div>
        ))}

      </div>

      {/* SEÇÃO INFERIOR */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 mt-10">

        {/* ÚLTIMAS CIDADES */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <h2 className="text-2xl font-bold mb-5">
            Últimas Cidades Pesquisadas
          </h2>

          <div className="space-y-4">

            <div className="bg-slate-800 p-4 rounded-xl">
              Unaí - MG
            </div>

            <div className="bg-slate-800 p-4 rounded-xl">
              Paracatu - MG
            </div>

            <div className="bg-slate-800 p-4 rounded-xl">
              Brasília - DF
            </div>

          </div>

        </div>

        {/* ÚLTIMOS PARCEIROS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <h2 className="text-2xl font-bold mb-5">
            Últimos Parceiros Fechados
          </h2>

          <div className="space-y-4">

            <div className="bg-slate-800 p-4 rounded-xl flex justify-between">
              <span>Oficina MotoMax</span>
              <span className="text-green-400">
                3 motos
              </span>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl flex justify-between">
              <span>Delivery Flash</span>
              <span className="text-green-400">
                5 motos
              </span>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl flex justify-between">
              <span>Agro Campo Forte</span>
              <span className="text-green-400">
                2 motos
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}