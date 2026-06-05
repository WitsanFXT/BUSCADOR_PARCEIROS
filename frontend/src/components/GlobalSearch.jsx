import {
  useState,
  useRef,
  useEffect
} from "react"

import axios from "axios"

import {
  Search,
  Building2,
  MapPin,
  Phone
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
        await axios.get(
          `http://localhost:3001/search?q=${encodeURIComponent(value)}`
        )

      setResults(data)

    } catch (err) {

      console.log(err)

    } finally {

      setLoading(false)

    }

  }

  function openLead(lead) {

    localStorage.setItem(
      "crmSearch",
      lead.city || lead.company_name
    )

    setResults([])

    navigate("/crm")

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
          placeholder="Buscar empresa, cidade, responsável ou telefone..."
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

            {results.map((lead) => (

              <div
                key={lead.id}
                onClick={() =>
                  openLead(lead)
                }
                className="p-4 border-b border-slate-800 hover:bg-slate-800 transition cursor-pointer"
              >

                <div className="flex items-start gap-3">

                  <div className="bg-red-600 p-2 rounded-xl">

                    <Building2
                      size={18}
                      className="text-white"
                    />

                  </div>

                  <div className="flex-1">

                    <h3 className="font-bold text-white">
                      {lead.company_name}
                    </h3>

                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">

                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {lead.city || "Sem cidade"}
                      </span>

                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {lead.phone || "Sem telefone"}
                      </span>

                    </div>

                    <div className="mt-2">

                      <span className="text-xs bg-blue-600 px-3 py-1 rounded-full">
                        {lead.status}
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

    </div>

  )

}