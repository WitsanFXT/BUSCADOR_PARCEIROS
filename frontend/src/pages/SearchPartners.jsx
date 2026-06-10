import {
  Search,
  MapPin,
  Building2,
  Loader2,
  Save
} from "lucide-react"

import { useMemo, useState } from "react"

import api from "../services/api"

export default function SearchPartners() {
  const [city, setCity] = useState("")
  const [radius, setRadius] = useState(25)
  const [type, setType] = useState("oficinas de motos")
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [savedIds, setSavedIds] = useState([])
  const [toast, setToast] = useState(null)

  const partnerTypes = [
  {
    label: "Oficinas",
    value: "oficinas de motos",
    intent: "Manutenção e indicação"
  },
  {
    label: "Moto Peças",
    value: "moto peças",
    intent: "Parceria comercial"
  },
  {
    label: "Motoboys",
    value: "motoboys",
    intent: "Uso profissional"
  },
  {
    label: "Entregas",
    value: "empresas de entrega",
    intent: "Frota e trabalho"
  },
  {
    label: "Mototáxi",
    value: "mototáxi",
    intent: "Uso profissional"
  },
  {
    label: "Frotas",
    value: "empresas com frota",
    intent: "Venda corporativa"
  }
]

  function showToast(type, title, message = "") {
    setToast({ type, title, message })
    setTimeout(() => setToast(null), 3000)
  }

  function selectedType() {
    return partnerTypes.find(item => item.value === type)
  }

  function companyKey(company, index) {
    return company.place_id || company.id || `${company.name || "empresa"}-${index}`
  }

  function getAddress(company) {
    return (
      company.formatted_address ||
      company.vicinity ||
      company.address ||
      "Endereço não informado"
    )
  }

  function getPhone(company) {
    return (
      company.formatted_phone_number ||
      company.international_phone_number ||
      company.phone ||
      ""
    )
  }

  function getMapsUrl(company) {
    if (company.url) return company.url

    if (company.place_id) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name || "")}&query_place_id=${company.place_id}`
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${company.name || ""} ${getAddress(company)} ${city}`)}`
  }

  function getWebsite(company) {
    return company.website || company.site || ""
  }

  function getBusinessStatus(company) {
    if (company.business_status === "OPERATIONAL") return "Ativo"
    if (company.business_status === "CLOSED_TEMPORARILY") return "Fechado temporariamente"
    if (company.business_status === "CLOSED_PERMANENTLY") return "Fechado permanentemente"
    return "Status não informado"
  }

  function getOpenStatus(company) {
    if (company.opening_hours?.open_now === true) return "Aberto agora"
    if (company.opening_hours?.open_now === false) return "Fechado agora"
    return "Horário não informado"
  }

  function buildPhoneSearchUrl(company) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${company.name || ""} ${city} telefone whatsapp`)}`
  }

  function buildInstagramSearchUrl(company) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${company.name || ""} ${city} instagram`)}`
  }

  async function searchCompanies() {
    if (!city.trim()) {
      showToast("warning", "Cidade obrigatória", "Informe uma cidade para buscar parceiros.")
      return
    }

    try {
      setLoading(true)
      setCompanies([])
      setSavedIds([])

      const response = await api.get("/maps/search", {
        params: {
          city: city.trim(),
          radius,
          type
        }
      })

      const result = Array.isArray(response.data)
        ? response.data
        : response.data?.results || []

      setCompanies(result)

      if (!result.length) {
        showToast("info", "Nenhum resultado", "Nenhuma empresa foi encontrada para essa busca.")
      } else {
        showToast("success", "Busca concluída", `${result.length} empresa(s) encontrada(s).`)
      }
    } catch (error) {
      console.log(error)
      showToast("error", "Erro ao buscar", "Não foi possível buscar empresas agora.")
    } finally {
      setLoading(false)
    }
  }

  async function saveLead(company, index) {
    const key = companyKey(company, index)
    const phone = getPhone(company)
    const typeData = selectedType()

    try {
      setSavingId(key)

      await api.post("/leads", {
        company_name: company.name || "Empresa sem nome",
        responsible: "",
        phone,
        whatsapp: phone,
        instagram: "",
        address: getAddress(company),
        city: city.trim(),
        status: "Novo Lead",
        interest: typeData?.intent || type,
        lead_source: "Google Places",
        notes:
          `Lead capturado pela Busca de Parceiros via Google Places.\n` +
          `Tipo pesquisado: ${type}.\n` +
          `Status Google: ${getBusinessStatus(company)}.\n` +
          `Horário: ${getOpenStatus(company)}.\n` +
          `Nota: ${company.rating || "sem nota"}.\n` +
          `Avaliações: ${company.user_ratings_total || 0}.\n` +
          `Place ID: ${company.place_id || "não informado"}.\n` +
          `Site: ${getWebsite(company) || "não informado"}.\n` +
          `Maps: ${getMapsUrl(company)}`,
        priority: "Normal",
        google_place_id: company.place_id || null,
        google_maps_url: getMapsUrl(company),
        website: getWebsite(company) || ""
      })

      setSavedIds(prev => [...prev, key])

      showToast("success", "Lead salvo", `${company.name || "Empresa"} foi enviado para o CRM.`)
    } catch (error) {
      console.log(error)
      showToast("error", "Erro ao salvar", "Não foi possível salvar este parceiro no CRM.")
    } finally {
      setSavingId(null)
    }
  }

  const metrics = useMemo(() => {
    return {
      total: companies.length,
      goodRating: companies.filter(item => Number(item.rating || 0) >= 4).length,
      withPhone: companies.filter(item => !!getPhone(item)).length,
      withWebsite: companies.filter(item => !!getWebsite(item)).length,
      saved: savedIds.length
    }
  }, [companies, savedIds])

  const toastColors = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-600 text-white"
  }

  return (
    <div className="text-white space-y-6">
      <div>
        <h1 className="text-4xl font-bold">
          Buscar Parceiros
        </h1>

        <p className="text-slate-400 mt-2">
          Prospecção local com dados comerciais. Encontre empresas e envie apenas bons contatos para o CRM.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-400">
              Cidade
            </label>

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Unaí MG"
              className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">
              Raio KM
            </label>

            <input
              type="number"
              min="1"
              max="100"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none"
            />
          </div>

          

          <div className="flex items-end">
            <button
              onClick={searchCompanies}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 transition rounded-xl p-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Buscar
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {partnerTypes.map(item => (
           <button
  key={item.value}
  onClick={() => setType(item.value)}
  className={`px-4 py-3 rounded-xl font-bold text-center transition ${
    type === item.value
      ? "bg-red-600"
      : "bg-slate-800 hover:bg-slate-700"
  }`}
>
  {item.label}
</button>
          ))}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-sm">
            Objetivo comercial do segmento selecionado
          </p>

          <p className="font-bold mt-1">
            {selectedType()?.intent || "Prospecção comercial"}
          </p>
        </div>
      </div>

      {companies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <p className="text-slate-400 text-sm">Encontradas</p>
            <h2 className="text-4xl font-bold mt-2">{metrics.total}</h2>
          </div>

          <div className="bg-green-600 rounded-3xl p-5">
            <p className="text-sm opacity-80">Nota 4+</p>
            <h2 className="text-4xl font-bold mt-2">{metrics.goodRating}</h2>
          </div>

          <div className="bg-blue-600 rounded-3xl p-5">
            <p className="text-sm opacity-80">Com telefone</p>
            <h2 className="text-4xl font-bold mt-2">{metrics.withPhone}</h2>
          </div>

          <div className="bg-purple-600 rounded-3xl p-5">
            <p className="text-sm opacity-80">Com site</p>
            <h2 className="text-4xl font-bold mt-2">{metrics.withWebsite}</h2>
          </div>

          <div className="bg-yellow-500 text-black rounded-3xl p-5">
            <p className="text-sm opacity-80">Salvas</p>
            <h2 className="text-4xl font-bold mt-2">{metrics.saved}</h2>
          </div>
        </div>
      )}

      {!loading && companies.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400">
          Informe cidade e segmento para iniciar uma busca de parceiros.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {companies.map((company, index) => {
          const key = companyKey(company, index)
          const saved = savedIds.includes(key)
          const phone = getPhone(company)
          const website = getWebsite(company)

          return (
            <div
              key={key}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold break-words">
                    {company.name || "Empresa sem nome"}
                  </h2>

                  <div className="flex items-start gap-2 text-slate-400 mt-3">
                    <MapPin size={18} className="shrink-0 mt-1" />
                    <span className="break-words">
                      {getAddress(company)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-xl text-sm font-bold">
                      ⭐ {company.rating || "Sem nota"}
                    </span>

                    <span className="bg-slate-700 px-3 py-1 rounded-xl text-sm font-bold">
                      📝 {company.user_ratings_total || 0} avaliações
                    </span>

                    <span className="bg-blue-600 px-3 py-1 rounded-xl text-sm font-bold">
                      {getBusinessStatus(company)}
                    </span>

                    <span className="bg-slate-700 px-3 py-1 rounded-xl text-sm font-bold">
                      {getOpenStatus(company)}
                    </span>

                    {phone && (
                      <span className="bg-green-600 px-3 py-1 rounded-xl text-sm font-bold">
                        ☎️ {phone}
                      </span>
                    )}

                    {website && (
                      <span className="bg-purple-600 px-3 py-1 rounded-xl text-sm font-bold">
                        Site disponível
                      </span>
                    )}
                  </div>

                  {company.types?.length > 0 && (
                    <p className="text-slate-500 text-sm mt-4 break-words">
                      Categorias Google: {company.types.slice(0, 4).join(", ")}
                    </p>
                  )}
                </div>

                <div className="bg-red-600 p-4 rounded-2xl shrink-0">
                  <Building2 size={28} />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
                <a
                  href={getMapsUrl(company)}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 transition text-center p-3 rounded-xl font-bold"
                >
                  Maps
                </a>

                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="bg-green-600 hover:bg-green-700 transition text-center p-3 rounded-xl font-bold"
                  >
                    Ligar
                  </a>
                ) : (
                  <a
                    href={buildPhoneSearchUrl(company)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-600 hover:bg-green-700 transition text-center p-3 rounded-xl font-bold"
                  >
                    Buscar Tel.
                  </a>
                )}

                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-purple-600 hover:bg-purple-700 transition text-center p-3 rounded-xl font-bold"
                  >
                    Site
                  </a>
                ) : (
                  <a
                    href={buildInstagramSearchUrl(company)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-pink-600 hover:bg-pink-700 transition text-center p-3 rounded-xl font-bold"
                  >
                    Instagram
                  </a>
                )}

                <a
                  href={buildInstagramSearchUrl(company)}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-pink-600 hover:bg-pink-700 transition text-center p-3 rounded-xl font-bold"
                >
                  Social
                </a>

                <button
                  onClick={() => saveLead(company, index)}
                  disabled={savingId === key || saved}
                  className={`transition p-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70 ${
                    saved
                      ? "bg-green-700"
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  <Save size={18} />
                  {saved
                    ? "Salvo"
                    : savingId === key
                      ? "Salvando..."
                      : "CRM"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div className={`${toastColors[toast.type] || toastColors.info} px-6 py-4 rounded-2xl shadow-2xl max-w-sm`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold">
                  {toast.title}
                </h3>

                {toast.message && (
                  <p className="text-sm mt-1 opacity-90">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => setToast(null)}
                className="font-bold"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}