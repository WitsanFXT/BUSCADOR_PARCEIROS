const express = require("express")
const axios = require("axios")

const router = express.Router()

router.get("/search", async (req, res) => {

  try {

    const {
      city,
      type
    } = req.query

    const query =
      `${type} em ${city}`

    /* INICIA ACTOR */
    const startResponse =
      await axios.post(

        `https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${process.env.APIFY_TOKEN}`,

        {
          searchStringsArray: [
            query
          ],

          maxCrawledPlacesPerSearch: 20,

          language: "pt-BR",

          region: "BR"
        }

      )

    const runId =
      startResponse.data.data.id

    /* ESPERA EXECUÇÃO */
    let finished = false
    let datasetId = null

    while (!finished) {

      await new Promise(resolve =>
        setTimeout(resolve, 3000)
      )

      const statusResponse =
        await axios.get(
          `https://api.apify.com/v2/actor-runs/${runId}?token=${process.env.APIFY_TOKEN}`
        )

      const status =
        statusResponse.data.data.status

      console.log(
        "STATUS:",
        status
      )

      if (
        status === "SUCCEEDED"
      ) {

        finished = true

        datasetId =
          statusResponse.data
            .data.defaultDatasetId

      }

      if (
        status === "FAILED"
      ) {

        return res.status(500).json({
          error:
            "Falha ao buscar empresas"
        })

      }

    }

    /* PEGA RESULTADOS */
    const datasetResponse =
      await axios.get(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}`
      )

    const companies =
      datasetResponse.data.map(
        (item) => ({

          id: item.placeId,

          name: item.title,

          address: item.address,

          phone: item.phone,

          website: item.website,

          rating: item.totalScore,

          reviews: item.reviewsCount,

          category: item.categoryName,

          latitude: item.location?.lat,

          longitude: item.location?.lng

        })
      )

    res.json(companies)

  } catch (error) {

    console.log(error.response?.data)

    res.status(500).json({
      error:
        error.response?.data ||
        error.message
    })

  }

})

module.exports = router
