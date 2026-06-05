import {
  Search,
  MapPin,
  Building2,
  Loader2,
  Save
} from "lucide-react"

import {
  useState
} from "react"

import api from "../services/api"

import { FaInstagram } from "react-icons/fa"

export default function SearchPartners() {

  const [city, setCity] =
    useState("")

  const [radius, setRadius] =
    useState(50)

  const [type, setType] =
    useState("Lojas de motos")

  const [companies, setCompanies] =
    useState([])

  const [loading, setLoading] =
    useState(false)

  async function searchCompanies() {

    try {

      setLoading(true)

      const response =
        await api.get("/maps/search", {
          params: {
            city,
            radius,
            type
          }
        })

      setCompanies(response.data)

    } catch (error) {

      console.log(error)

      alert(
        "Erro ao buscar empresas"
      )

    } finally {

      setLoading(false)

    }

  }

  async function saveLead(company) {

    try {

      await api.post("/leads", {

        company_name: company.name,

        responsible: "",

        phone:
          company.formatted_phone_number ||
          "",

        whatsapp: "",

        instagram: "",

        address:
          company.vicinity || "",

        city,

        status: "Novo Lead",

        interest: "Não definido",

        notes:
          "Lead capturado pelo Google Maps",

        priority: "Normal"

      })

      alert(
        "Lead salvo com sucesso!"
      )

    } catch (error) {

      console.log(error)

      alert(
        "Erro ao salvar lead"
      )

    }

  }

  return (
    <div className="text-white">

      {/* TOPO */}
      <div className="mb-10">

        <h1 className="text-4xl font-bold">
          Buscar Parceiros
        </h1>

        <p className="text-slate-400 mt-2">
          Encontre empresas para parceria comercial
        </p>

      </div>

      {/* FILTROS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8">

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* Cidade */}
          <div>

            <label className="text-sm text-slate-400">
              Cidade
            </label>

            <input
              type="text"
              value={city}
              onChange={(e) =>
                setCity(e.target.value)
              }
              placeholder="Ex: Unaí"
              className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none"
            />

          </div>

          {/* RAIO */}
          <div>

            <label className="text-sm text-slate-400">
              Raio KM
            </label>

            <input
              type="number"
              value={radius}
              onChange={(e) =>
                setRadius(e.target.value)
              }
              className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none"
            />

          </div>

          {/* TIPO */}
          <div>

            <label className="text-sm text-slate-400">
              Tipo de Empresa
            </label>

            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value)
              }
              className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none"
            >

              <option>
                lojas de motos
              </option>

              <option>
                oficinas
              </option>

              <option>
                auto peças
              </option>

              <option>
                despachantes
              </option>

              <option>
                locadoras
              </option>

              <option>
                fazendas
              </option>

              <option>
                empresas de entrega
              </option>

              <option>
                mototáxi
              </option>

              <option>
                empresas de segurança
              </option>

            </select>

          </div>

          {/* BOTÃO */}
          <div className="flex items-end">

            <button
              onClick={searchCompanies}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 transition rounded-xl p-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >

              {loading ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />

                  Buscando...
                </>
              ) : (
                <>
                  <Search size={20} />

                  Buscar Empresas
                </>
              )}

            </button>

          </div>

        </div>

      </div>

      {/* RESULTADOS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {companies.map((company, index) => (

          <div
            key={index}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
          >

            <div className="flex items-start justify-between gap-4">

              <div className="flex-1">

                <h2 className="text-2xl font-bold">
                  {company.name}
                </h2>

                <div className="flex items-center gap-2 text-slate-400 mt-3">

                  <MapPin size={18} />

                  <span>
                    {company.vicinity}
                  </span>

                </div>

                <div className="mt-4 space-y-2">

                  <p>
                    ⭐ {company.rating || "Sem nota"}
                  </p>

                  <p>
                    📝 {company.user_ratings_total || 0} avaliações
                  </p>

                  <p>
                    📍 Google Maps Business
                  </p>

                </div>

              </div>

              <div className="bg-red-600 p-4 rounded-2xl">

                <Building2 size={28} />

              </div>

            </div>

            {/* BOTÕES */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">

              {/* MAPS */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${company.name}`}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-700 transition text-center p-3 rounded-xl font-bold"
              >
                Maps
              </a>

              {/* WHATS */}
              <a
                href={`https://www.google.com/search?q=${company.name}+telefone`}
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 hover:bg-green-700 transition text-center p-3 rounded-xl font-bold"
              >
                WhatsApp
              </a>

              {/* INSTAGRAM */}
              <a
                href={`https://www.instagram.com/explore/tags/${company.name}`}
                target="_blank"
                rel="noreferrer"
                className="bg-pink-600 hover:bg-pink-700 transition text-center p-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >

              

                Insta

              </a>

              {/* SALVAR */}
              <button
                onClick={() =>
                  saveLead(company)
                }
                className="bg-slate-700 hover:bg-slate-600 transition p-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >

                <Save size={18} />

                Salvar

              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}