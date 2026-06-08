const express = require("express")

const router = express.Router()

const supabase =
  require("../config/supabase")

function todayDate() {
  return new Date()
    .toISOString()
    .split("T")[0]
}

function addDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)

  return date
    .toISOString()
    .split("T")[0]
}

const weeklyIdeas = [
  {
    type: "Vídeo",
    theme: "Financiamento",
    title: "Quanto preciso ganhar para financiar uma Factor 150?",
    script: "Explique de forma simples que cada análise depende de renda, entrada, score e banco. Mostre que o ideal é fazer uma simulação personalizada.",
    caption: "Muita gente acha que financiar uma moto é impossível, mas a verdade é que cada caso precisa ser analisado. Quer saber se uma Factor 150 cabe no seu bolso? Me chama que faço uma simulação sem compromisso.",
    status_text: "Você sabe quanto precisa ganhar para financiar uma Factor 150? Me chama que eu faço uma simulação personalizada."
  },
  {
    type: "Status WhatsApp",
    theme: "Entrega",
    title: "Cliente saiu de moto nova",
    script: "Poste uma foto ou vídeo curto de uma entrega real ou simulação de entrega.",
    caption: "Mais uma conquista saindo da Yamaha. Moto nova, economia e confiança para o dia a dia.",
    status_text: "Hoje foi dia de entrega! Mais um cliente saindo de moto nova e pronto para rodar com economia."
  },
  {
    type: "Instagram",
    theme: "Comparação",
    title: "Factor ou Fazer: qual combina mais com você?",
    script: "Mostre a Factor como econômica e prática, e a Fazer como mais potente e confortável.",
    caption: "Factor ou Fazer? A melhor escolha depende do seu uso. Para economia no dia a dia, Factor. Para mais desempenho e conforto, Fazer. Quer comparar as parcelas? Me chama.",
    status_text: "Factor ou Fazer? Eu te ajudo a escolher a Yamaha ideal para seu momento."
  },
  {
    type: "Vídeo",
    theme: "Objeção",
    title: "Estou sem entrada. Consigo financiar?",
    script: "Explique que depende da análise, mas que moto usada pode entrar como parte do negócio e existem condições diferentes conforme perfil.",
    caption: "Está sem entrada? Antes de desistir, vale fazer uma análise. Em alguns casos, sua moto usada pode ajudar na negociação.",
    status_text: "Sem entrada? Talvez ainda exista uma possibilidade. Me chama para avaliar seu caso."
  },
  {
    type: "Status WhatsApp",
    theme: "Trabalho",
    title: "Moto para trabalhar e aumentar renda",
    script: "Fale com motoboys, entregadores e profissionais autônomos.",
    caption: "Uma moto econômica pode ser ferramenta de trabalho, renda e liberdade. Quer ver opções para trabalhar melhor? Me chama.",
    status_text: "Trabalha com entregas ou precisa de moto para o dia a dia? Tenho opções Yamaha para você avaliar."
  },
  {
    type: "Instagram",
    theme: "Consumo",
    title: "Moto econômica para rodar todos os dias",
    script: "Mostre a importância de economia, manutenção e confiabilidade.",
    caption: "Quem roda todo dia sabe: economia faz diferença no fim do mês. Uma Yamaha pode te ajudar a trabalhar mais gastando menos.",
    status_text: "Economia no combustível faz diferença. Quer conhecer uma Yamaha para o dia a dia?"
  },
  {
    type: "Vídeo",
    theme: "Bastidores",
    title: "Bastidores da loja Yamaha",
    script: "Mostre motos no showroom, chegada de unidades, preparação de entrega ou detalhes dos modelos.",
    caption: "Um pouco dos bastidores da Yamaha por aqui. Qual modelo você quer ver em detalhes?",
    status_text: "Bastidores da Yamaha hoje. Quer que eu mostre algum modelo específico?"
  }
]

async function ensureContentIdeas() {

  const today =
    todayDate()

  const { data } =
    await supabase
      .from("content_ideas")
      .select("*")
      .gte("content_date", today)

  if (data && data.length > 0) return

  const rows =
    weeklyIdeas.map((item, index) => ({
      ...item,
      content_date: addDays(index),
      status: "Pendente"
    }))

  await supabase
    .from("content_ideas")
    .insert(rows)

}

router.get("/", async (req, res) => {

  try {

    await ensureContentIdeas()

    const { data, error } =
      await supabase
        .from("content_ideas")
        .select("*")
        .order("content_date", {
          ascending: true
        })

    if (error) {
      return res.status(400).json(error)
    }

    res.json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

router.post("/generate", async (req, res) => {

  try {

    const today =
      todayDate()

    await supabase
      .from("content_ideas")
      .delete()
      .gte("content_date", today)
      .eq("status", "Pendente")

    const rows =
      weeklyIdeas.map((item, index) => ({
        ...item,
        content_date: addDays(index),
        status: "Pendente"
      }))

    const { data, error } =
      await supabase
        .from("content_ideas")
        .insert(rows)
        .select()

    if (error) {

      console.log("ERRO AO GERAR CONTEÚDO:")
      console.log(error)

      return res.status(400).json(error)

    }

    res.status(201).json(data)

  } catch (err) {

    console.log(err)

    res.status(500).json({
      error: err.message
    })

  }

})

router.put("/:id/status", async (req, res) => {

  try {

    const { id } =
      req.params

    const { status } =
      req.body

    const { data, error } =
      await supabase
        .from("content_ideas")
        .update({
          status
        })
        .eq("id", id)
        .select()

    if (error) {
      return res.status(400).json(error)
    }

    res.json(data)

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

router.delete("/:id", async (req, res) => {

  try {

    const { id } =
      req.params

    const { error } =
      await supabase
        .from("content_ideas")
        .delete()
        .eq("id", id)

    if (error) {
      return res.status(400).json(error)
    }

    res.json({
      success: true
    })

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

})

module.exports = router