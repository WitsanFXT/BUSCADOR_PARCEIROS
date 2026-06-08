import {
  useState,
  useRef,
  useEffect
} from "react"

import api from "../services/api"

import {
  Search,
  Building2,
  MapPin,
  Phone,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Bot,
  Plus,
  Navigation
} from "lucide-react"

import {
  useNavigate
} from "react-router-dom"

export default function GlobalSearch() {

  const navigate = useNavigate()

  const searchRef = useRef(null)

  const [query, setQuery] =
    useState("")

  const [results, setResults] =
    useState([])

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {

    function handleClickOutside(event) {

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {

        setResults([])

      }

    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    )

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      )

    }

  }, [])

  async function search(value) {

    setQuery(value)

    if (!value.trim()) {

      setResults([])
      return

    }

    try {

      setLoading(true)

      const { data } =
        await api.get(
          `/search?q=${encodeURIComponent(value)}`
        )

      setResults(data)

    } catch (err) {

      console.log(err)

    } finally {

      setLoading(false)

    }

  }

  function getIcon(item) {

    if (item.type === "lead") {
      return <Building2 size={18} className="text-white" />
    }

    if (item.action === "new-lead") {
      return <Plus size={18} className="text-white" />
    }

    if (item.path === "/") {
      return <LayoutDashboard size={18} className="text-white" />
    }

    if (item.path === "/crm") {
      return <Users size={18} className="text-white" />
    }

    if (item.path === "/checklist") {
      return <ClipboardCheck size={18} className="text-white" />
    }

    if (item.path === "/automacao") {
      return <Bot size={18} className="text-white" />
    }

    return <Navigation size={18} className="text-white" />

  }

  function getBadge(item) {

    if (item.type === "lead") {
      return "Lead"
    }

    if (item.type === "action") {
      return "Ação"
    }

    return "Página"

  }

  function openResult(item) {

    setResults([])
    setQuery("")

    if (item.type === "lead") {

      localStorage.setItem(
        "crmSearch",
        item.lead.city ||
        item.lead.company_name
      )

      navigate("/crm")
      return

    }

    if (item.action === "new-lead") {

      localStorage.setItem(
        "openNewLeadModal",
        "true"
      )

      navigate("/crm")
      return

    }

    navigate(item.path)

  }

  return (

    <div
      ref={searchRef}
      className="relative w-full"
    >

      <div className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 flex items-center gap-4">

        <Search
          size={20}
          className="text-slate-400"
        />

        <input
          type="text"
          placeholder="Buscar leads, páginas, ações ou funções do sistema..."
          value={query}
          onChange={(e) =>
            search(e.target.value)
          }
          className="bg-transparent outline-none text-white w-full placeholder:text-slate-500"
        />

      </div>

      {loading && (

        <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-2xl mt-2 p-4 text-slate-400">

          Buscando...

        </div>

      )}

      {!loading &&
        results.length > 0 && (

          <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-2xl mt-2 overflow-hidden shadow-2xl">

            {results.map((item, index) => (

              <div
                key={`${item.type}-${item.title}-${index}`}
                onClick={() =>
                  openResult(item)
                }
                className="p-4 border-b border-slate-800 hover:bg-slate-800 transition cursor-pointer"
              >

                <div className="flex items-start gap-3">

                  <div className="bg-red-600 p-2 rounded-xl">

                    {getIcon(item)}

                  </div>

                  <div className="flex-1">

                    <div className="flex items-center justify-between gap-3">

                      <h3 className="font-bold text-white">
                        {item.title}
                      </h3>

                      <span className="text-xs bg-blue-600 px-3 py-1 rounded-full text-white">
                        {getBadge(item)}
                      </span>

                    </div>

                    <p className="text-slate-400 text-sm mt-1">
                      {item.description}
                    </p>

                    {item.type === "lead" && (

                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">

                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {item.lead.city || "Sem cidade"}
                        </span>

                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {item.lead.phone || "Sem telefone"}
                        </span>

                      </div>

                    )}

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      {!loading &&
        query.trim() &&
        results.length === 0 && (

          <div className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-2xl mt-2 p-4 text-slate-400">

            Nenhum resultado encontrado.

          </div>

        )}

    </div>

  )

}