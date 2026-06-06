import {
  LayoutDashboard,
  Search,
  Users,
  Bot,
  ClipboardCheck,
  X
} from "lucide-react"


import {
  Link,
  useLocation
} from "react-router-dom"

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen
}) {

  const location = useLocation()

  const menus = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard size={20} />
    },
    {
      name: "Buscar Parceiros",
      path: "/buscar",
      icon: <Search size={20} />
    },
    {
      name: "CRM",
      path: "/crm",
      icon: <Users size={20} />
    },
    {
      name: "Automação",
      path: "/automacao",
      icon: <Bot size={20} />
    },
    {
      name: "Checklist",
      path: "/checklist",
      icon: <ClipboardCheck size={20} />
    }

  ]

  return (
    <>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-72
          bg-slate-900 border-r border-slate-800
          transition-transform duration-300

          ${sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
          }

          lg:translate-x-0
        `}
      >

        <div className="p-6 h-full flex flex-col">

          {/* TOPO */}
          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold text-white">
                MotoLead Pro
              </h1>

              <p className="text-slate-400 text-sm mt-2">
                CRM Yamaha Partners
              </p>

            </div>

            {/* FECHAR MOBILE */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden bg-slate-800 p-2 rounded-xl"
            >

              <X
                size={20}
                className="text-white"
              />

            </button>

          </div>

          {/* MENUS */}
          <div className="space-y-3 mt-10">

            {menus.map((menu, index) => {

              const active =
                location.pathname === menu.path

              return (
                <Link
                  key={index}
                  to={menu.path}
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                  className={`
                    flex items-center gap-4
                    px-5 py-4 rounded-2xl
                    transition-all font-medium

                    ${
                      active
                        ? "bg-red-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }
                  `}
                >

                  {menu.icon}

                  {menu.name}

                </Link>
              )
            })}

          </div>

        </div>

      </aside>

    </>
  )
}