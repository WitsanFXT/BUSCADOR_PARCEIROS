// backend/src/services/socialScraper.service.js

const axios = require("axios")

function detectPlatform(url) {
  if (url.includes("instagram.com")) return "Instagram"
  if (url.includes("facebook.com")) return "Facebook"
  return "Unknown"
}

async function runApifyActor(actorId, input) {
  const token = process.env.APIFY_TOKEN
  if (!token) throw new Error("APIFY_TOKEN não configurado")

  const startResponse = await axios.post(
    `https://api.apify.com/v2/acts/${actorId.replace("/", "~")}/runs?token=${token}`,
    input
  )

  const runId = startResponse.data.data.id
  let status = "RUNNING"
  let datasetId = null
  let attempts = 0
  const maxAttempts = 10

  while ((status === "RUNNING" || status === "READY") && attempts < maxAttempts) {
    attempts++
    await new Promise(resolve => setTimeout(resolve, 3000))

    const statusResponse = await axios.get(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`
    )
    status = statusResponse.data.data.status
    console.log("APIFY STATUS:", status)

    if (status === "SUCCEEDED") {
      datasetId = statusResponse.data.data.defaultDatasetId
      break
    }

    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
      throw new Error(`Apify falhou com status: ${status}`)
    }
  }

  if (!datasetId) {
    throw new Error("Tempo limite ao aguardar o Apify. Tente novamente com uma publicação menor.")
  }

  const datasetResponse = await axios.get(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
  )

  return datasetResponse.data || []
}

async function scrapeSocialPost(url) {
  const platform = detectPlatform(url)

  if (platform === "Instagram") {
    const actorId = process.env.APIFY_INSTAGRAM_ACTOR
    if (!actorId) throw new Error("APIFY_INSTAGRAM_ACTOR não configurado")

    const items = await runApifyActor(actorId, { directUrls: [url], resultsLimit: 100 })

    const text = items
      .map(item => [
        item.ownerUsername ? `@${item.ownerUsername}` : "",
        item.text || item.comment || item.caption || ""
      ].filter(Boolean).join(": "))
      .filter(Boolean)
      .join("\n")

    return { platform, rawItems: items, text }
  }

  if (platform === "Facebook") {
    const actorId = process.env.APIFY_FACEBOOK_ACTOR
    if (!actorId) throw new Error("APIFY_FACEBOOK_ACTOR não configurado")

    const items = await runApifyActor(actorId, { startUrls: [{ url }], resultsLimit: 100 })

    const text = items
      .map(item => [
        item.author || item.profileName || "",
        item.text || item.commentText || item.message || ""
      ].filter(Boolean).join(": "))
      .filter(Boolean)
      .join("\n")

    return { platform, rawItems: items, text }
  }

  throw new Error("Plataforma não suportada. Use Instagram ou Facebook.")
}

module.exports = { scrapeSocialPost }