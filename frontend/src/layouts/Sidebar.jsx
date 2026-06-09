import {
  LayoutDashboard,
  Search,
  Users,
  Bot,
  ClipboardCheck,
  X,
  Radar as RadarIcon,
  CalendarClock,
  ListChecks,
  Clapperboard,
  Handshake,
  GitBranch,
  BrainCircuit,
  AlarmClock,
  RefreshCcw,
  Sparkles
} from "lucide-react"

import {
  Link,
  useLocation
} from "react-router-dom"

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen
}) {

  const location =
    useLocation()

  const menuGroups = [
    {
      title: "Principal",
      items: [
        {
          name: "Dashboard",
          path: "/",
          icon: <LayoutDashboard size={20} />
        },

        {
          name: "Assistente IA",
          path: "/assistente-ia",
          icon: <Sparkles size={20} />
        },

        {
          name: "CRM",
          path: "/crm",
          icon: <Users size={20} />
        },
        {
          name: "Buscar Parceiros",
          path: "/buscar",
          icon: <Search size={20} />
        }
      ]
    },

    {
  title: "Vendas",
  items: [
    {
      name: "Funil de Vendas",
      path: "/funil",
      icon: <GitBranch size={20} />
    },
    {
      name: "Prioridades IA",
      path: "/ia-prioridades",
      icon: <BrainCircuit size={20} />
    },
    {
      name: "IA de Conversão",
      path: "/ia-conversao",
      icon: <Bot size={20} />
    }
  ]
},

    {
      title: "Prospecção",
      items: [
        {
          name: "Radar",
          path: "/radar",
          icon: <RadarIcon size={20} />
        },

        {
          name: "Recuperação IA",
          path: "/recuperacao-leads",
          icon: <RefreshCcw size={20} />
        },

        {
          name: "Agenda Inteligente",
          path: "/agenda",
          icon: <CalendarClock size={20} />
        },
        {
          name: "Missões do Dia",
          path: "/missoes",
          icon: <ListChecks size={20} />
        },
        {
          name: "Checklist",
          path: "/checklist",
          icon: <ClipboardCheck size={20} />
        },
        {
          name: "Follow-up IA",
          path: "/followup-ia",
          icon: <AlarmClock size={20} />
        },
      ]
    },
    {
      title: "Marketing",
      items: [
        {
          name: "Conteúdo",
          path: "/conteudo",
          icon: <Clapperboard size={20} />
        },
        {
          name: "Automação",
          path: "/automacao",
          icon: <Bot size={20} />
        }
      ]
    },
    {
      title: "Relacionamento",
      items: [
        {
          name: "Indicações",
          path: "/indicacoes",
          icon: <Handshake size={20} />
        }
      ]
    }
  ]

  return (
    <>

      {sidebarOpen && (
        <div
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed
          top-0
          left-0
          z-50
          h-screen
          w-72
          bg-slate-900
          border-r
          border-slate-800
          transition-transform
          duration-300
          ${sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
          }
          lg:translate-x-0
        `}
      >

        <div className="h-full flex flex-col">

          <div className="p-6 border-b border-slate-800">

            <div className="flex items-center justify-between gap-4">

              <div>

                <h1 className="text-3xl font-bold text-white">
                  MotoLead Pro
                </h1>

                <p className="text-slate-400 text-sm mt-2">
                  CRM Yamaha Partners
                </p>

              </div>

              <button
                onClick={() =>
                  setSidebarOpen(false)
                }
                className="lg:hidden bg-slate-800 p-2 rounded-xl"
              >

                <X
                  size={20}
                  className="text-white"
                />

              </button>

            </div>

          </div>

          <nav className="flex-1 overflow-y-auto p-5 space-y-7">

            {menuGroups.map(group => (

              <div key={group.title}>

                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3 px-2">
                  {group.title}
                </p>

                <div className="space-y-2">

                  {group.items.map(item => {

                    const active =
                      location.pathname === item.path

                    return (

                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() =>
                          setSidebarOpen(false)
                        }
                        className={`
                          flex
                          items-center
                          gap-4
                          px-4
                          py-3
                          rounded-2xl
                          transition-all
                          font-medium
                          ${
                            active
                              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }
                        `}
                      >

                        {item.icon}

                        <span>
                          {item.name}
                        </span>

                      </Link>

                    )

                  })}

                </div>

              </div>

            ))}

          </nav>

          <div className="p-5 border-t border-slate-800">

            <div className="bg-slate-800 rounded-2xl p-4">

              <p className="text-xs text-slate-400">
                Sistema Comercial
              </p>

              <p className="text-white font-bold mt-1">
                Yamaha Partners
              </p>

            </div>

          </div>

        </div>

      </aside>

    </>
  )

}