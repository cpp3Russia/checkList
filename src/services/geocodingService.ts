export interface ReverseGeocodeResult {
  label: string
  city?: string
  country?: string
  countryCode?: string
}

interface BigDataCloudResponse {
  locality?: string
  city?: string
  principalSubdivision?: string
  countryName?: string
  countryCode?: string
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
  const search = new URLSearchParams({
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    localityLanguage: 'zh'
  })

  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${search.toString()}`
  )

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with ${response.status}`)
  }

  const payload = (await response.json()) as BigDataCloudResponse
  const city = payload.city || payload.locality || payload.principalSubdivision
  const country = payload.countryName

  return {
    label: [city, country].filter(Boolean).join(', ') || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    city,
    country,
    countryCode: payload.countryCode
  }
}
