export interface LiveFlight {
  id: string
  icao24: string
  callsign: string
  originCountry: string
  longitude: number
  latitude: number
  baroAltitude: number | null
  velocity: number | null
  trueTrack: number | null
  verticalRate: number | null
  geoAltitude: number | null
  lastContact: number
}

interface OpenSkyStateVectorResponse {
  time: number
  states: Array<
    [
      string,
      string | null,
      string,
      number | null,
      number | null,
      number | null,
      number | null,
      number | null,
      boolean,
      number | null,
      number | null,
      number | null,
      number[] | null,
      number | null,
      string | null,
      boolean,
      number
    ]
  > | null
}

const DEFAULT_BOUNDS = {
  lamin: 1,
  lomin: 95,
  lamax: 55,
  lomax: 145
}

const FLIGHT_LIMIT = 12

const getBaseUrl = () => import.meta.env.VITE_OPENSKY_BASE_URL || '/api/opensky'

const toNumber = (value: number | null | undefined) => (typeof value === 'number' ? value : null)

export async function fetchLiveFlights(): Promise<LiveFlight[]> {
  const search = new URLSearchParams({
    lamin: String(DEFAULT_BOUNDS.lamin),
    lomin: String(DEFAULT_BOUNDS.lomin),
    lamax: String(DEFAULT_BOUNDS.lamax),
    lomax: String(DEFAULT_BOUNDS.lomax)
  })

  const response = await fetch(`${getBaseUrl()}/states/all?${search.toString()}`)

  if (!response.ok) {
    throw new Error(`Flight API request failed with ${response.status}`)
  }

  const payload = (await response.json()) as OpenSkyStateVectorResponse

  const flights =
    payload.states
      ?.map((state) => {
        const longitude = toNumber(state[5])
        const latitude = toNumber(state[6])
        const onGround = Boolean(state[8])
        const callsign = state[1]?.trim() || state[0].toUpperCase()

        if (longitude === null || latitude === null || onGround) {
          return null
        }

        return {
          id: `${state[0]}-${state[3] ?? payload.time}`,
          icao24: state[0],
          callsign,
          originCountry: state[2],
          longitude,
          latitude,
          baroAltitude: toNumber(state[7]),
          velocity: toNumber(state[9]),
          trueTrack: toNumber(state[10]),
          verticalRate: toNumber(state[11]),
          geoAltitude: toNumber(state[13]),
          lastContact: state[4] ?? payload.time
        } satisfies LiveFlight
      })
      .filter((flight): flight is LiveFlight => Boolean(flight))
      .sort((a, b) => {
        const speedA = a.velocity ?? 0
        const speedB = b.velocity ?? 0
        return speedB - speedA
      })
      .slice(0, FLIGHT_LIMIT) ?? []

  return flights
}
