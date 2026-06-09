function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function calculateLeadScore(lead) {

  let score = 0

  const status =
    normalize(lead.status)

  const interest =
    normalize(lead.interest)

  const priority =
    normalize(lead.priority)

  const source =
    normalize(lead.lead_source)

  const motorcycle =
    normalize(lead.current_motorcycle)

  const timeline =
    normalize(lead.purchase_timeline)

  const year =
    Number(lead.motorcycle_year || 0)

  const mileage =
    Number(lead.mileage || 0)

  if (priority.includes("alta")) score += 25
  if (priority.includes("media")) score += 15
  if (priority.includes("baixa")) score += 5

  if (status.includes("negociando")) score += 25
  if (status.includes("interessado")) score += 25
  if (status.includes("novo")) score += 10
  if (status.includes("perdido")) score -= 30
  if (status.includes("parceiro")) score -= 20

  if (interest.includes("motoboy")) score += 25
  if (interest.includes("entregador")) score += 25
  if (interest.includes("delivery")) score += 20
  if (interest.includes("moto taxi")) score += 25
  if (interest.includes("mototaxi")) score += 25
  if (interest.includes("oficina")) score += 15
  if (interest.includes("auto escola")) score += 20
  if (interest.includes("empresa")) score += 15
  if (interest.includes("fazenda")) score += 10

  if (lead.whatsapp) score += 15
  if (lead.phone) score += 10
  if (lead.instagram) score += 10
  if (lead.city) score += 5

  if (lead.professional_use) score += 25

  if (source.includes("radar")) score += 15
  if (source.includes("indicacao")) score += 20
  if (source.includes("marketplace")) score += 15
  if (source.includes("facebook")) score += 10
  if (source.includes("instagram")) score += 10

  if (motorcycle) score += 10

  if (
    motorcycle.includes("factor") ||
    motorcycle.includes("fazer") ||
    motorcycle.includes("crosser") ||
    motorcycle.includes("cg") ||
    motorcycle.includes("bros")
  ) {
    score += 20
  }

  const currentYear =
    new Date().getFullYear()

  const age =
    year > 0
      ? currentYear - year
      : 0

  if (age >= 8) score += 25
  else if (age >= 5) score += 20
  else if (age >= 3) score += 10

  if (mileage >= 80000) score += 25
  else if (mileage >= 50000) score += 20
  else if (mileage >= 30000) score += 10

  if (timeline.includes("imediata")) score += 25
  if (timeline.includes("30")) score += 20
  if (timeline.includes("3 meses")) score += 15
  if (timeline.includes("6 meses")) score += 5

  score =
    Math.max(
      0,
      Math.min(score, 100)
    )

  return score

}

function getLeadTemperature(score) {

  if (score >= 70) return "Quente"
  if (score >= 40) return "Morno"

  return "Frio"

}

module.exports = {
  calculateLeadScore,
  getLeadTemperature
}