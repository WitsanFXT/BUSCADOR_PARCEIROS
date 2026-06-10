const express = require("express")
const axios = require("axios")

const router = express.Router()

function normalizePlace(place) {
  return {
    place_id: place.id || "",
    name: place.displayName?.text || "Empresa sem nome",
    formatted_address: place.formattedAddress || "",
    vicinity: place.shortFormattedAddress || place.formattedAddress || "",
    formatted_phone_number: place.nationalPhoneNumber || "",
    international_phone_number: place.internationalPhoneNumber || "",
    website: place.websiteUri || "",
    url: place.googleMapsUri || "",
    rating: place.rating || null,
    user_ratings_total: place.userRatingCount || 0,
    business_status: place.businessStatus || "",
    opening_hours: {
      open_now: place.regularOpeningHours?.openNow ?? null
    },
    types: place.types || [],
    location: {
      lat: place.location?.latitude || null,
      lng: place.location?.longitude || null
    }
  }
}

router.get("/search", async (req, res) => {
  try {
    const { city, type, radius } = req.query

    if (!city || !type) {
      return res.status(400).json({
        error: "Cidade e tipo são obrigatórios"
      })
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        error: "GOOGLE_MAPS_API_KEY não configurada no .env"
      })
    }

    const textQuery = `${type} em ${city}`

    const response = await axios.post(
      "https://places.googleapis.com/v1/places:searchText",
      {
        textQuery,
        languageCode: "pt-BR",
        regionCode: "BR",
        maxResultCount: 20
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.shortFormattedAddress",
            "places.nationalPhoneNumber",
            "places.internationalPhoneNumber",
            "places.websiteUri",
            "places.googleMapsUri",
            "places.rating",
            "places.userRatingCount",
            "places.businessStatus",
            "places.regularOpeningHours",
            "places.types",
            "places.location"
          ].join(",")
        }
      }
    )

    const places = response.data?.places || []

    const companies = places.map(normalizePlace)

    res.json(companies)
  } catch (error) {
    console.log(error.response?.data || error.message)

    res.status(500).json({
      error: error.response?.data || error.message
    })
  }
})

module.exports = router