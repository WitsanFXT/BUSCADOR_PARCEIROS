const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

router.get("/", async (req, res) => {

  try {

    const { q } = req.query

    if (!q || q.trim() === "") {
      return res.json([])
    }

    const search =
      q.trim().toLowerCase()

    const results = []

    const systemItems = [
      {
        type: "page",
        title: "Dashboard",
        description: "Ver indicadores, métricas e resumo do sistema",
        path: "/",
        keywords: [
          "dashboard",
          "inicio",
          "início",
          "metricas",
          "métricas",
          "resumo",
          "painel"
        ]
      },
      {
        type: "page",
        title: "Buscar Parceiros",
        description: "Buscar empresas no Google Maps para prospecção",
        path: "/buscar",
        keywords: [
          "buscar",
          "parceiros",
          "empresas",
          "google",
          "maps",
          "prospectar",
          "prospecção",
          "cidade"
        ]
      },
      {
        type: "page",
        title: "CRM",
        description: "Gerenciar leads, contatos e negociações",
        path: "/crm",
        keywords: [
          "crm",
          "leads",
          "clientes",
          "contatos",
          "negociação",
          "negociacao",
          "parceiro"
        ]
      },
      {
        type: "page",
        title: "Checklist",
        description: "Ver 10 do dia, atendidos hoje, nunca contatados e histórico",
        path: "/checklist",
        keywords: [
          "checklist",
          "10 do dia",
          "atendidos",
          "atendidos hoje",
          "nunca contatados",
          "historico",
          "histórico",
          "contatos do dia"
        ]
      },
      {
        type: "page",
        title: "Automação",
        description: "Ferramentas rápidas para prospecção comercial",
        path: "/automacao",
        keywords: [
          "automação",
          "automacao",
          "mensagem",
          "whatsapp",
          "instagram",
          "copiar",
          "agendar",
          "retorno"
        ]
      },
      {
        type: "action",
        title: "Novo Lead",
        description: "Cadastrar manualmente um novo lead",
        path: "/crm",
        action: "new-lead",
        keywords: [
          "novo lead",
          "criar lead",
          "cadastrar lead",
          "adicionar lead",
          "novo cliente"
        ]
      },
      {
        type: "page",
        title: "Radar de Oportunidades",
        description: "Encontrar sinais de compra, marketplace, Facebook, Instagram e indicações",
        path: "/radar",
        keywords: [
          "radar",
          "oportunidades",
          "marketplace",
          "facebook",
          "instagram",
          "indicação",
          "indicacao",
          "motoboy",
          "entregador",
          "troca de moto"
        ]
        },
        {
          type: "page",
          title: "Agenda Inteligente",
          description: "Prioridades do dia, follow-ups e contatos mais importantes",
          path: "/agenda",
          keywords: [
            "agenda",
            "follow-up",
            "followup",
            "retorno",
            "prioridade",
            "prioridades",
            "contatos do dia",
            "ligar hoje",
            "whatsapp hoje"
        ]
        },
        {
          type: "page",
          title: "Missões do Dia",
          description: "Metas diárias de WhatsApp, Marketplace, indicações, conteúdo e follow-up",
          path: "/missoes",
          keywords: [
            "missões",
            "missoes",
            "metas",
            "meta diaria",
            "meta diária",
            "whatsapp",
            "marketplace",
            "indicação",
            "indicacao",
            "conteúdo",
            "conteudo",
            "follow-up",
            "tarefas do dia"
          ]
          },

        {
          type: "page",
          title: "Indicações",
          description: "Parceiros indicadores, ranking, comissões e clientes indicados",
          path: "/indicacoes",
          keywords: [
            "indicações",
            "indicacoes",
            "indicador",
            "parceiro",
            "comissão",
            "comissao",
            "oficina",
            "borracharia",
            "motopeças",
            "motopecas",
            "ranking"
          ]
          },

          {
            type: "page",
            title: "Funil de Vendas",
            description: "Etapas comerciais, simulações, documentação, análise de crédito e vendas",
            path: "/funil",
            keywords: [
              "funil",
              "vendas",
              "etapas",
              "simulação",
              "simulacao",
              "documentação",
              "documentacao",
              "analise de credito",
              "análise de crédito",
              "venda realizada",
              "perdido"
            ]
          },

          {
            type: "page",
            title: "Central de Conteúdo",
            description: "Ideias de vídeos, Instagram, WhatsApp Status e legendas",
            path: "/conteudo",
            keywords: [
              "conteúdo",
              "conteudo",
              "post",
              "instagram",
              "status",
              "whatsapp status",
              "legenda",
              "video",
              "vídeo",
              "roteiro",
              "stories",
              "reels"
            ]
            },
    ]

    systemItems.forEach(item => {

      const matchTitle =
        item.title.toLowerCase().includes(search)

      const matchDescription =
        item.description.toLowerCase().includes(search)

      const matchKeyword =
        item.keywords.some(keyword =>
          keyword.toLowerCase().includes(search)
        )

      if (
        matchTitle ||
        matchDescription ||
        matchKeyword
      ) {
        results.push(item)
      }

    })

    const { data, error } =
      await supabase
        .from("leads")
        .select("*")
        .or(
          `company_name.ilike.%${search}%,city.ilike.%${search}%,responsible.ilike.%${search}%,phone.ilike.%${search}%,whatsapp.ilike.%${search}%,status.ilike.%${search}%,interest.ilike.%${search}%,priority.ilike.%${search}%`
        )
        .limit(20)

    if (error) {

      console.log(error)

      return res.status(400).json(error)

    }

    const leadResults =
      (data || []).map(lead => ({
        type: "lead",
        title: lead.company_name,
        description: `${lead.city || "Sem cidade"} • ${lead.status || "Sem status"}`,
        path: "/crm",
        lead
      }))

    res.json([
      ...results,
      ...leadResults
    ])

  } catch (err) {

    console.log(err)

    res.status(500).json({
      error: err.message
    })

  }

})

module.exports = router