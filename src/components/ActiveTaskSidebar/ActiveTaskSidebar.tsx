import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Switch,
  Typography
} from '@mui/material'
import {
  BarChartRounded as BarChartRoundedIcon,
  PauseRounded as PauseRoundedIcon,
  PlayArrowRounded as PlayArrowRoundedIcon,
  RefreshRounded as RefreshRoundedIcon,
  StopRounded as StopRoundedIcon
} from '@mui/icons-material'
import { reverseGeocode, type ReverseGeocodeResult } from '@/services/geocodingService'
import { fetchLiveFlights, type LiveFlight } from '@/services/flightService'
import { useChecklistStore } from '@/store/checklistStore'
import { useTimerStore } from '@/store/timerStore'
import type { ChecklistItem as ChecklistItemType } from '@/types'
import { formatDuration } from '@/utils/dateUtils'

interface ActiveTaskSidebarProps {
  statsItems: ChecklistItemType[]
  onTimerComplete?: (payload: { taskId: string; elapsedMs: number }) => void
}

interface GeoPoint {
  latitude: number
  longitude: number
}

interface AirportDefinition {
  code: string
  name: string
  point: GeoPoint
}

interface FlightSnapshot {
  id: string
  flightCode: string
  sourceType: 'live' | 'upcoming'
  origin: string
  destination: string
  currentPoint: GeoPoint
  heading: number
  altitudeFeet: number | null
  altitudeLabel: string
  departureTime: Date
  arrivalTime: Date
  location: ReverseGeocodeResult | null
  routeProgress: number
  totalDistanceKm: number
  completedDistanceKm: number
  remainingDistanceKm: number
  airportNote: string
  timeNote: string
}

interface ScheduledFlightDefinition {
  id: string
  flightCode: string
  originCode: string
  destinationCode: string
  departureOffsetMinutes: number
  durationMinutes: number
  heading: number
}

const airports: AirportDefinition[] = [
  { code: 'PVG', name: '上海浦东', point: { latitude: 31.1443, longitude: 121.8083 } },
  { code: 'SHA', name: '上海虹桥', point: { latitude: 31.1979, longitude: 121.3363 } },
  { code: 'PEK', name: '北京首都', point: { latitude: 40.0799, longitude: 116.6031 } },
  { code: 'PKX', name: '北京大兴', point: { latitude: 39.5098, longitude: 116.4105 } },
  { code: 'CAN', name: '广州白云', point: { latitude: 23.3924, longitude: 113.2988 } },
  { code: 'SZX', name: '深圳宝安', point: { latitude: 22.6393, longitude: 113.8107 } },
  { code: 'CTU', name: '成都双流', point: { latitude: 30.5785, longitude: 103.9471 } },
  { code: 'TFU', name: '成都天府', point: { latitude: 30.319, longitude: 104.445 } },
  { code: 'HGH', name: '杭州萧山', point: { latitude: 30.2361, longitude: 120.435 } },
  { code: 'XIY', name: '西安咸阳', point: { latitude: 34.4471, longitude: 108.7516 } },
  { code: 'KMG', name: '昆明长水', point: { latitude: 25.1019, longitude: 102.9292 } },
  { code: 'CSX', name: '长沙黄花', point: { latitude: 28.1892, longitude: 113.2206 } },
  { code: 'NKG', name: '南京禄口', point: { latitude: 31.7411, longitude: 118.862 } },
  { code: 'XMN', name: '厦门高崎', point: { latitude: 24.544, longitude: 118.1275 } },
  { code: 'WUH', name: '武汉天河', point: { latitude: 30.7838, longitude: 114.2081 } },
  { code: 'TSN', name: '天津滨海', point: { latitude: 39.1244, longitude: 117.3462 } }
]

const airportMap = new Map(airports.map((airport) => [airport.code, airport]))

/** 中国热门航线数据库：航班号前缀 → 可能的航司+基地，用于辅助匹配 */
const popularRoutes: Array<{ origin: string; destination: string; prefixes?: string[] }> = [
  // 京沪线
  { origin: 'PEK', destination: 'SHA', prefixes: ['CA1', 'MU5'] },
  { origin: 'PKX', destination: 'SHA', prefixes: ['CA1', 'CZ6'] },
  { origin: 'PEK', destination: 'PVG', prefixes: ['CA1', 'MU5'] },
  { origin: 'PKX', destination: 'PVG', prefixes: ['CA1', 'CZ6'] },
  // 京广/京深线
  { origin: 'PEK', destination: 'CAN', prefixes: ['CA3', 'CZ3'] },
  { origin: 'PEK', destination: 'SZX', prefixes: ['CA1', 'CZ3'] },
  { origin: 'PKX', destination: 'CAN', prefixes: ['CZ3', 'CA3'] },
  { origin: 'PKX', destination: 'SZX', prefixes: ['CZ3', 'ZH9'] },
  // 沪广/沪深线
  { origin: 'PVG', destination: 'CAN', prefixes: ['MU3', 'CZ3'] },
  { origin: 'PVG', destination: 'SZX', prefixes: ['MU3', 'ZH9'] },
  { origin: 'SHA', destination: 'CAN', prefixes: ['MU3', 'CZ3'] },
  { origin: 'SHA', destination: 'SZX', prefixes: ['MU3', 'ZH9'] },
  // 西南线
  { origin: 'PEK', destination: 'CTU', prefixes: ['CA4', '3U8'] },
  { origin: 'PEK', destination: 'TFU', prefixes: ['CA4', '3U8'] },
  { origin: 'PVG', destination: 'CTU', prefixes: ['MU5', '3U8'] },
  { origin: 'PVG', destination: 'TFU', prefixes: ['MU5', '3U8'] },
  { origin: 'CAN', destination: 'CTU', prefixes: ['CZ3', '3U8'] },
  { origin: 'CAN', destination: 'TFU', prefixes: ['CZ3', '3U8'] },
  // 华东/华南
  { origin: 'HGH', destination: 'PEK', prefixes: ['CA1', 'MU5'] },
  { origin: 'NKG', destination: 'PEK', prefixes: ['MU5'] },
  { origin: 'XMN', destination: 'PEK', prefixes: ['MF8'] },
  { origin: 'CSX', destination: 'PEK', prefixes: ['CZ3'] },
  // 西北/西南
  { origin: 'XIY', destination: 'PEK', prefixes: ['CA1', 'MU5'] },
  { origin: 'KMG', destination: 'PEK', prefixes: ['CA4', 'MU5'] },
  { origin: 'XIY', destination: 'PVG', prefixes: ['MU5', 'FM9'] },
  { origin: 'KMG', destination: 'PVG', prefixes: ['MU5', 'FM9'] },
  // 华中
  { origin: 'WUH', destination: 'PEK', prefixes: ['CA1', 'MU5'] },
  { origin: 'WUH', destination: 'PVG', prefixes: ['MU5', 'FM9'] },
  { origin: 'WUH', destination: 'CAN', prefixes: ['CZ3'] },
  { origin: 'WUH', destination: 'SZX', prefixes: ['CZ3', 'ZH9'] }
]

const scheduledFlightPool: ScheduledFlightDefinition[] = [
  { id: 'upcoming-mu5101', flightCode: 'MU5101', originCode: 'SHA', destinationCode: 'PEK', departureOffsetMinutes: 15, durationMinutes: 135, heading: 335 },
  { id: 'upcoming-ca1837', flightCode: 'CA1837', originCode: 'PEK', destinationCode: 'SZX', departureOffsetMinutes: 35, durationMinutes: 185, heading: 190 },
  { id: 'upcoming-cz3527', flightCode: 'CZ3527', originCode: 'CAN', destinationCode: 'TFU', departureOffsetMinutes: 55, durationMinutes: 150, heading: 302 },
  { id: 'upcoming-ho1289', flightCode: 'HO1289', originCode: 'PVG', destinationCode: 'CSX', departureOffsetMinutes: 75, durationMinutes: 120, heading: 250 },
  { id: 'upcoming-mf8321', flightCode: 'MF8321', originCode: 'XMN', destinationCode: 'PKX', departureOffsetMinutes: 95, durationMinutes: 170, heading: 8 },
  { id: 'upcoming-zh9135', flightCode: 'ZH9135', originCode: 'SZX', destinationCode: 'XIY', departureOffsetMinutes: 105, durationMinutes: 160, heading: 315 }
]

const MAX_ALTITUDE_FEET = 40000

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60 * 1000)
const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
const formatDistance = (distanceKm: number) =>
  `${Math.max(0, Math.round(distanceKm)).toLocaleString('zh-CN')} km`

const shuffle = <T,>(items: T[]) => {
  const cloned = [...items]
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]]
  }
  return cloned
}

const toAltitudeFeet = (altitudeMeters: number | null | undefined) => {
  if (typeof altitudeMeters !== 'number' || Number.isNaN(altitudeMeters)) {
    return null
  }

  return Math.max(0, Math.round(altitudeMeters * 3.28084))
}

const formatAltitude = (altitudeFeet: number | null) =>
  altitudeFeet === null ? '--' : `${altitudeFeet.toLocaleString('zh-CN')} ft`

const normalizeHeading = (heading: number | null | undefined) =>
  typeof heading === 'number' && Number.isFinite(heading) ? heading : 90

const getAirportByCode = (code: string) => airportMap.get(code)

/** 逆地理编码缓存，避免同一区域重复请求 */
const geocodeCache = new Map<string, ReverseGeocodeResult | null>()
const cachedReverseGeocode = async (latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> => {
  // 约 11km 精度的缓存 key（1 位小数）
  const cacheKey = `${latitude.toFixed(1)},${longitude.toFixed(1)}`
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) ?? null
  }
  const result = await reverseGeocode(latitude, longitude).catch(() => null)
  geocodeCache.set(cacheKey, result)
  // 缓存上限 200 条，防止内存泄漏
  if (geocodeCache.size > 200) {
    const firstKey = geocodeCache.keys().next().value
    if (firstKey !== undefined) geocodeCache.delete(firstKey)
  }
  return result
}

const haversineDistanceKm = (from: GeoPoint, to: GeoPoint) => {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRadians(to.latitude - from.latitude)
  const dLon = toRadians(to.longitude - from.longitude)
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a))
}

/** 计算从 from 到 to 的初始方位角（bearing），0°=北，90°=东 */
const computeBearing = (from: GeoPoint, to: GeoPoint): number => {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const toDegrees = (value: number) => (value * 180) / Math.PI
  const dLon = toRadians(to.longitude - from.longitude)
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)
  const x = Math.sin(dLon) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return (toDegrees(Math.atan2(x, y)) + 360) % 360
}

/** 将角度归一化到 [-180, 180] 范围，用于比较航向差 */
const normalizeAngle = (angle: number): number => {
  let result = angle % 360
  if (result > 180) result -= 360
  if (result < -180) result += 360
  return result
}

const estimateRouteForLiveFlight = (flight: LiveFlight) => {
  const currentPoint: GeoPoint = { latitude: flight.latitude, longitude: flight.longitude }
  const heading = normalizeHeading(flight.trueTrack)

  // ── Step 1: 尝试通过航班号匹配热门航线 ──
  const callsign = (flight.callsign || '').trim().toUpperCase()
  const matchedRoute = popularRoutes.find((route) => {
    if (!route.prefixes) return false
    return route.prefixes.some((prefix) => callsign.startsWith(prefix))
  })

  if (matchedRoute) {
    const originAirport = getAirportByCode(matchedRoute.origin)
    const destinationAirport = getAirportByCode(matchedRoute.destination)
    if (originAirport && destinationAirport) {
      // 校验：航班当前位置应该在这条航线的走廊附近（距两端连线 500km 以内）
      const distToOrigin = haversineDistanceKm(currentPoint, originAirport.point)
      const distToDest = haversineDistanceKm(currentPoint, destinationAirport.point)
      const routeDistance = haversineDistanceKm(originAirport.point, destinationAirport.point)
      // 如果航班离两端都很远，说明可能飞反方向或不在该航线上
      if (distToOrigin < routeDistance * 1.5 && distToDest < routeDistance * 1.5) {
        // 判断方向：航向应该大致朝向目的地
        const bearingToDest = computeBearing(currentPoint, destinationAirport.point)
        const headingDiff = Math.abs(normalizeAngle(heading - bearingToDest))
        const bearingToOrigin = computeBearing(currentPoint, originAirport.point)
        const headingDiffReverse = Math.abs(normalizeAngle(heading - bearingToOrigin))

        if (headingDiff < 90 || headingDiffReverse > 90) {
          // 航向大致朝向目的地，匹配成功
          return { originAirport, destinationAirport }
        }
        // 方向反了，交换起降
        if (headingDiffReverse < 90 || headingDiff > 90) {
          return { originAirport: destinationAirport, destinationAirport: originAirport }
        }
      }
    }
  }

  // ── Step 2: 基于航向的"前方最近=目的地"+"后方最近=出发地"算法 ──
  const headingRad = (heading * Math.PI) / 180

  // 将机场投影到航向向量上：正值=前方，负值=后方
  const airportProjections = airports.map((airport) => {
    const dLat = airport.point.latitude - flight.latitude
    const dLon = airport.point.longitude - flight.longitude
    // 投影：沿航向方向的分量（正=前方，负=后方）
    const forwardProjection = dLat * Math.cos(headingRad) + dLon * Math.sin(headingRad)
    const distance = haversineDistanceKm(currentPoint, airport.point)
    return { airport, forwardProjection, distance }
  })

  // 目的地：在航向"前方"且距离最近的机场（投影 > 0 且有合理距离）
  const forwardAirports = airportProjections
    .filter((p) => p.forwardProjection > 0.5 && p.distance > 100) // 至少前方 0.5° 且 100km 以外
    .sort((a, b) => a.distance - b.distance)

  const destinationAirport = forwardAirports[0]?.airport

  // 出发地：在航向"后方"且距离最近的机场（投影 < 0）
  const backwardAirports = airportProjections
    .filter((p) => {
      if (destinationAirport && p.airport.code === destinationAirport.code) return false
      return p.forwardProjection < -0.5 && p.distance > 50 // 后方至少 0.5° 且 50km 以外
    })
    .sort((a, b) => a.distance - b.distance)

  const originAirport = backwardAirports[0]?.airport

  if (!destinationAirport || !originAirport) {
    // 兜底：如果方向判断失败，退化为找最近两个不同机场
    const fallback = [...airports]
      .sort((a, b) => haversineDistanceKm(currentPoint, a.point) - haversineDistanceKm(currentPoint, b.point))
    const dest = fallback[0]
    const origin = fallback.find((a) => a.code !== dest.code)
    if (!dest || !origin) return null
    // 根据航向判断谁出发谁到达
    const bearingToFirst = computeBearing(currentPoint, dest.point)
    const diff = Math.abs(normalizeAngle(heading - bearingToFirst))
    return diff < 90
      ? { originAirport: origin, destinationAirport: dest }
      : { originAirport: dest, destinationAirport: origin }
  }

  return { originAirport, destinationAirport }
}

const buildUpcomingSnapshot = async (
  definition: ScheduledFlightDefinition,
  now: Date
): Promise<FlightSnapshot | null> => {
  const originAirport = getAirportByCode(definition.originCode)
  const destinationAirport = getAirportByCode(definition.destinationCode)

  if (!originAirport || !destinationAirport) {
    return null
  }

  const departureTime = addMinutes(now, definition.departureOffsetMinutes)
  const arrivalTime = addMinutes(departureTime, definition.durationMinutes)
  const totalDistanceKm = haversineDistanceKm(originAirport.point, destinationAirport.point)
  const location = await cachedReverseGeocode(originAirport.point.latitude, originAirport.point.longitude)

  return {
    id: definition.id,
    flightCode: definition.flightCode,
    sourceType: 'upcoming',
    origin: originAirport.name,
    destination: destinationAirport.name,
    currentPoint: originAirport.point,
    heading: definition.heading,
    altitudeFeet: 0,
    altitudeLabel: '0 ft',
    departureTime,
    arrivalTime,
    location,
    routeProgress: 0,
    totalDistanceKm,
    completedDistanceKm: 0,
    remainingDistanceKm: totalDistanceKm,
    airportNote: '起降机场来自页面内演示航班池。',
    timeNote: '这里展示的是演示计划航班的起飞与到达时间。'
  }
}

const buildLiveSnapshot = async (flight: LiveFlight, now: Date): Promise<FlightSnapshot | null> => {
  const route = estimateRouteForLiveFlight(flight)
  if (!route) {
    return null
  }

  const currentPoint = { latitude: flight.latitude, longitude: flight.longitude }
  const completedDistanceKm = haversineDistanceKm(route.originAirport.point, currentPoint)
  const remainingDistanceKm = haversineDistanceKm(currentPoint, route.destinationAirport.point)
  const totalDistanceKm = Math.max(1, completedDistanceKm + remainingDistanceKm)
  const routeProgress = clamp(completedDistanceKm / totalDistanceKm, 0.08, 0.92)
  const speedMetersPerSecond = flight.velocity ?? 230
  const remainingMinutes = Math.max(20, Math.round((remainingDistanceKm * 1000) / speedMetersPerSecond / 60))
  const elapsedMinutes = Math.max(25, Math.round((completedDistanceKm * 1000) / speedMetersPerSecond / 60))
  const altitudeFeet = toAltitudeFeet(flight.geoAltitude ?? flight.baroAltitude)
  const departureTime = addMinutes(now, -elapsedMinutes)
  const arrivalTime = addMinutes(now, remainingMinutes)
  const location = await cachedReverseGeocode(flight.latitude, flight.longitude)

  return {
    id: `live-${flight.id}`,
    flightCode: flight.callsign || flight.icao24.toUpperCase(),
    sourceType: 'live',
    origin: route.originAirport.name,
    destination: route.destinationAirport.name,
    currentPoint,
    heading: normalizeHeading(flight.trueTrack),
    altitudeFeet,
    altitudeLabel: formatAltitude(altitudeFeet),
    departureTime,
    arrivalTime,
    location,
    routeProgress,
    totalDistanceKm,
    completedDistanceKm,
    remainingDistanceKm,
    airportNote: '起降机场根据当前位置和航向推算，仅作参考。',
    timeNote: '时间根据实时位置、速度和进度推算。'
  }
}

export const ActiveTaskSidebar: React.FC<ActiveTaskSidebarProps> = ({
  statsItems,
  onTimerComplete
}) => {
  const { activeTaskId, isRunning, pauseTimer, startTimer, stopTimer, getElapsedMs } = useTimerStore()
  const { items } = useChecklistStore()
  const [elapsed, setElapsed] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [flightSnapshots, setFlightSnapshots] = useState<FlightSnapshot[]>([])
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioNodesRef = useRef<{ source?: AudioBufferSourceNode } | null>(null)

  const activeTask = useMemo(() => resolveActiveTask(items, activeTaskId), [activeTaskId, items])
  const completedTodayCount = useMemo(
    () => statsItems.filter((item) => item.completed).length,
    [statsItems]
  )
  const focusHours = useMemo(
    () => statsItems.reduce((total, item) => total + (item.completedDurationMs ?? 0), 0) / 3_600_000,
    [statsItems]
  )
  const completionDelta = useMemo(
    () => Math.max(0, statsItems.filter((item) => item.completed && item.completedAt).length - statsItems.filter((item) => !item.completed).length),
    [statsItems]
  )

  const selectedFlight = useMemo(
    () => flightSnapshots.find((item) => item.id === selectedFlightId) ?? flightSnapshots[0] ?? null,
    [flightSnapshots, selectedFlightId]
  )

  useEffect(() => {
    let interval: number | undefined

    if (isRunning) {
      setElapsed(getElapsedMs())
      interval = window.setInterval(() => {
        setElapsed(getElapsedMs())
      }, 1000)
    } else {
      setElapsed(getElapsedMs())
    }

    return () => {
      if (interval) {
        window.clearInterval(interval)
      }
    }
  }, [activeTaskId, getElapsedMs, isRunning])

  useEffect(() => {
    if (soundEnabled) {
      void startCabinNoise(audioContextRef, audioNodesRef)
    } else {
      stopCabinNoise(audioContextRef, audioNodesRef)
    }

    return () => stopCabinNoise(audioContextRef, audioNodesRef)
  }, [soundEnabled])

  useEffect(() => {
    void loadFlights()

    const interval = window.setInterval(() => {
      void loadFlights({ silent: true })
    }, 60_000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const loadFlights = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      setError(null)

      const requestTime = new Date()
      const liveFlights = await fetchLiveFlights().catch(() => [])
      const liveCandidates = shuffle(liveFlights).slice(0, 4)
      const liveSnapshots = (
        await Promise.all(liveCandidates.map((flight) => buildLiveSnapshot(flight, requestTime)))
      ).filter((flight): flight is FlightSnapshot => Boolean(flight))

      const upcomingCandidates = shuffle(scheduledFlightPool).slice(0, 2)
      const upcomingSnapshots = (
        await Promise.all(upcomingCandidates.map((flight) => buildUpcomingSnapshot(flight, requestTime)))
      ).filter((flight): flight is FlightSnapshot => Boolean(flight))

      const combined = shuffle([...liveSnapshots, ...upcomingSnapshots]).slice(0, 5)

      if (!combined.length) {
        throw new Error('暂时没有可展示的航班数据，请稍后刷新重试。')
      }

      setFlightSnapshots(combined)
      setLastUpdatedAt(requestTime)
      setSelectedFlightId((current) => {
        if (current && combined.some((flight) => flight.id === current)) {
          return current
        }
        return combined[0]?.id ?? null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载航班失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStopAndComplete = () => {
    const result = stopTimer()
    if (result.taskId && result.elapsedMs > 0) {
      onTimerComplete?.({ taskId: result.taskId, elapsedMs: result.elapsedMs })
    }
  }

  return (
    <Stack spacing={2.5} sx={{ px: 0.5 }}>
      <TaskFocusCard
        activeTask={activeTask?.title}
        activeDescription={activeTask?.description}
        isRunning={isRunning}
        elapsed={elapsed}
        onPause={pauseTimer}
        onResume={() => activeTask && startTimer(activeTask.id)}
        onFinish={handleStopAndComplete}
      />

      <EfficiencyCard
        completedTodayCount={completedTodayCount}
        completionDelta={completionDelta}
        focusHours={focusHours}
      />

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: '28px',
          bgcolor: '#ffffff',
          border: '1px solid rgba(226, 231, 241, 0.96)',
          boxShadow: '0 18px 40px rgba(34, 52, 84, 0.08)'
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 900, color: '#1f2430' }}>
                模拟航行
              </Typography>
              <Typography variant="caption" sx={{ color: '#7f8797' }}>
                实时航班与演示航线混合展示
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#98a0af', mt: 0.5 }}>
                {lastUpdatedAt ? `每 60 秒自动刷新 · 上次 ${formatTime(lastUpdatedAt)}` : '每 60 秒自动刷新'}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="text"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => void loadFlights()}
              sx={{ minWidth: 0, color: '#1a63d9', fontWeight: 700, fontSize: 12 }}
            >
              刷新
            </Button>
          </Stack>

          {error ? <Alert severity="warning">{error}</Alert> : null}

          {loading ? (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : selectedFlight ? (
            <Stack spacing={1.75}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {flightSnapshots.map((flight) => (
                  <Button
                    key={flight.id}
                    size="small"
                    variant={selectedFlight.id === flight.id ? 'contained' : 'outlined'}
                    onClick={() => setSelectedFlightId(flight.id)}
                    sx={{
                      minWidth: 0,
                      px: 1.4,
                      py: 0.65,
                      borderRadius: '999px',
                      fontSize: '12px',
                      bgcolor: selectedFlight.id === flight.id ? '#1a63d9' : '#fff',
                      borderColor: '#d6ddea'
                    }}
                  >
                    {flight.flightCode}
                  </Button>
                ))}
              </Stack>

              <MiniFlightCard flight={selectedFlight} />
            </Stack>
          ) : null}

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              mt: 0.5,
              p: 1.4,
              borderRadius: '18px',
              bgcolor: '#f7f9fc',
              border: '1px solid #edf1f6'
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#5d6678' }}>
                机舱白噪音
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#98a0af' }}>
                模拟机舱环境声
              </Typography>
            </Box>
            <Switch checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} />
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  )
}

const REVIEW_INSTANCE_SUFFIX = '::review::'

const resolveActiveTask = (items: ChecklistItemType[], activeTaskId: string | null) => {
  if (!activeTaskId) {
    return undefined
  }

  const exactMatch = items.find((item) => item.id === activeTaskId)
  if (exactMatch) {
    return exactMatch
  }

  const sourceTaskId = activeTaskId.includes(REVIEW_INSTANCE_SUFFIX)
    ? activeTaskId.split(REVIEW_INSTANCE_SUFFIX)[0]
    : activeTaskId

  return items.find((item) => item.id === sourceTaskId)
}

function TaskFocusCard({
  activeTask,
  activeDescription,
  isRunning,
  elapsed,
  onPause,
  onResume,
  onFinish
}: {
  activeTask?: string
  activeDescription?: string
  isRunning: boolean
  elapsed: number
  onPause: () => void
  onResume: () => void
  onFinish: () => void
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '30px',
        background: 'linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)',
        border: '1px solid rgba(227,231,239,0.95)',
        boxShadow: '0 20px 44px rgba(34, 52, 84, 0.12)'
      }}
    >
      <Stack spacing={2.25}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontSize: '18px', fontWeight: 900, color: '#1f2430' }}>当前任务</Typography>
          <Chip
            label={isRunning ? '进行中' : '已暂停'}
            size="small"
            sx={{
              bgcolor: '#edf4ff',
              color: '#1a63d9',
              fontWeight: 800,
              borderRadius: '999px',
              '.MuiChip-label': { px: 1.5 },
              fontSize: 12
            }}
          />
        </Stack>

        <Box>
          <Typography sx={{ color: '#0e5bd9', fontSize: '18px', fontWeight: 900, lineHeight: 1.35 }}>
            {activeTask || '选择一个任务开始专注'}
          </Typography>
          <Typography sx={{ mt: 1, color: '#5e687b', fontSize: '14px', lineHeight: 1.7 }}>
            {activeDescription || '启动任务计时后，这里会展示当前任务内容与专注状态。'}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: '54px',
            fontWeight: 400,
            letterSpacing: '0.04em',
            lineHeight: 1,
            color: '#1b2431',
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'center',
            py: 1
          }}
        >
          {formatDuration(elapsed)}
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            onClick={isRunning ? onPause : onResume}
            sx={{
              minWidth: 0,
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: '#0f5fd8',
              boxShadow: '0 14px 26px rgba(15, 95, 216, 0.26)',
              '&:hover': { bgcolor: '#0b52bc' }
            }}
          >
            {isRunning ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
          </Button>
          <Button
            variant="outlined"
            onClick={onFinish}
            sx={{
              minWidth: 0,
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: '#f3f4f7',
              borderColor: '#e1e5ee',
              color: '#263041',
              '&:hover': { bgcolor: '#ebedf3', borderColor: '#d7dce6' }
            }}
          >
            <StopRoundedIcon />
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function EfficiencyCard({
  completedTodayCount,
  completionDelta,
  focusHours
}: {
  completedTodayCount: number
  completionDelta: number
  focusHours: number
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '28px',
        bgcolor: '#ffffff',
        border: '1px solid rgba(227,231,239,0.92)',
        boxShadow: '0 14px 30px rgba(34, 52, 84, 0.08)'
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#e8f1ff',
              color: '#1a63d9'
            }}
          >
            <BarChartRoundedIcon sx={{ fontSize: 16 }} />
          </Box>
          <Typography sx={{ fontSize: '16px', fontWeight: 900, color: '#1f2430' }}>今日效率统计</Typography>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <StatMiniCard label="已完成任务" value={String(completedTodayCount)} accent={`+${completionDelta}`} />
          <StatMiniCard label="专注时长" value={`${focusHours.toFixed(1)}h`} />
        </Stack>
      </Stack>
    </Paper>
  )
}

function StatMiniCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.8,
        borderRadius: '18px',
        bgcolor: '#ffffff',
        border: '1px solid #ebedf2',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)'
      }}
    >
      <Typography sx={{ color: '#7c8596', fontSize: '12px', fontWeight: 700 }}>{label}</Typography>
      <Stack direction="row" spacing={0.8} alignItems="baseline" sx={{ mt: 1 }}>
        <Typography sx={{ color: '#0f5fd8', fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>{value}</Typography>
        {accent ? <Typography sx={{ color: '#ff7d45', fontSize: '12px', fontWeight: 800 }}>{accent}</Typography> : null}
      </Stack>
    </Box>
  )
}

function MiniFlightCard({ flight }: { flight: FlightSnapshot }) {
  const start = { x: 12, y: 84 }
  const end = { x: 88, y: 84 }
  const progress = flight.sourceType === 'upcoming' ? 0.05 : clamp(flight.routeProgress, 0.08, 0.92)
  const altitudeProgress = clamp((flight.altitudeFeet ?? 0) / MAX_ALTITUDE_FEET, 0, 1)
  const current = {
    x: start.x + (end.x - start.x) * progress,
    y: 84 - altitudeProgress * 48
  }
  const ascentControl = { x: start.x + (current.x - start.x) / 2, y: Math.min(start.y, current.y) - 15 }
  const descentControl = { x: current.x + (end.x - current.x) / 2, y: Math.min(end.y, current.y) - 15 }

  return (
    <Box
      sx={{
        p: 1.6,
        borderRadius: '22px',
        bgcolor: '#f8fbff',
        border: '1px solid #e7edf6'
      }}
    >
      <Stack spacing={1.4}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 900, color: '#1f2430' }}>
              {flight.origin} 到 {flight.destination}
            </Typography>
            <Typography sx={{ mt: 0.4, fontSize: '12px', color: '#7e8796' }}>
              {formatTime(flight.departureTime)} 起飞 · {formatTime(flight.arrivalTime)} 到达
            </Typography>
          </Box>
          <Chip
            label={flight.sourceType === 'live' ? '实时' : '计划'}
            size="small"
            sx={{ height: 24, bgcolor: '#eef3ff', color: '#1a63d9', fontWeight: 800, fontSize: 12 }}
          />
        </Stack>

        <Box
          sx={{
            position: 'relative',
            height: 164,
            borderRadius: '18px',
            overflow: 'hidden',
            background:
              'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.7), transparent 26%), linear-gradient(180deg, #d9e8ff 0%, #b5d6ff 46%, #d7efe6 46%, #b9decf 100%)'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 'auto 0 0 0',
              height: 54,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.85) 100%)'
            }}
          />

          {[0, 20000, 40000].map((altitude) => {
            const top = 84 - (altitude / MAX_ALTITUDE_FEET) * 48
            return (
              <Box
                key={altitude}
                sx={{
                  position: 'absolute',
                  left: 18,
                  right: 16,
                  top: `${top}%`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box sx={{ width: 8, height: 1, bgcolor: 'rgba(20, 93, 205, 0.25)' }} />
                <Typography sx={{ fontSize: '10px', color: '#59718e', minWidth: 44 }}>
                  {altitude / 1000}k ft
                </Typography>
                <Box sx={{ flex: 1, height: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
              </Box>
            )
          })}

          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0 }}
          >
            <path
              d={`M ${start.x} ${start.y} Q ${ascentControl.x} ${ascentControl.y} ${current.x} ${current.y}`}
              fill="none"
              stroke="#175fce"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <path
              d={`M ${current.x} ${current.y} Q ${descentControl.x} ${descentControl.y} ${end.x} ${end.y}`}
              fill="none"
              stroke="rgba(23,95,206,0.35)"
              strokeWidth="1.7"
              strokeDasharray="4 3"
            />
          </svg>

          <Box
            sx={{
              position: 'absolute',
              left: `${current.x}%`,
              top: `${current.y}%`,
              transform: `translate(-50%, -50%) rotate(${flight.heading}deg)`,
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: '#125ecf',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 18px rgba(18, 94, 207, 0.24)',
              fontSize: '13px'
            }}
          >
            ✈
          </Box>

          <Box
            sx={{
              position: 'absolute',
              left: 12,
              bottom: 10,
              px: 1.2,
              py: 0.8,
              borderRadius: '12px',
              bgcolor: 'rgba(255,255,255,0.94)'
            }}
          >
            <Typography sx={{ fontSize: '10px', color: '#738091' }}>已飞</Typography>
            <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#1f2430' }}>
              {formatDistance(flight.completedDistanceKm)}
            </Typography>
          </Box>

          <Box
            sx={{
              position: 'absolute',
              right: 12,
              bottom: 10,
              px: 1.2,
              py: 0.8,
              borderRadius: '12px',
              bgcolor: 'rgba(255,255,255,0.94)',
              textAlign: 'right'
            }}
          >
            <Typography sx={{ fontSize: '10px', color: '#738091' }}>高度 / 剩余</Typography>
            <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#1f2430' }}>
              {flight.altitudeLabel} · {formatDistance(flight.remainingDistanceKm)}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.2}>
          {/* <InfoPill label="当前位置" value={flight.location?.city || flight.location?.country || '空域中'} /> */}
          <InfoPill label="总航程" value={formatDistance(flight.totalDistanceKm)} />
        </Stack>

        <Typography sx={{ fontSize: '11px', color: '#7e8796', lineHeight: 1.6 }}>
          {flight.sourceType === 'live' ? flight.airportNote : flight.timeNote}
        </Typography>
      </Stack>
    </Box>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.2,
        borderRadius: '14px',
        bgcolor: '#ffffff',
        border: '1px solid #edf1f6'
      }}
    >
      <Typography sx={{ fontSize: '10px', color: '#8a92a2' }}>{label}</Typography>
      <Typography sx={{ mt: 0.4, fontSize: '12px', fontWeight: 800, color: '#1f2430' }}>{value}</Typography>
    </Box>
  )
}

async function startCabinNoise(
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  audioNodesRef: React.MutableRefObject<{ source?: AudioBufferSourceNode } | null>
) {
  if (audioContextRef.current) {
    return
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  if (!AudioContextCtor) {
    return
  }

  const context = new AudioContextCtor()
  if (context.state === 'suspended') {
    await context.resume()
  }

  const bufferSize = context.sampleRate * 2
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)

  for (let index = 0; index < bufferSize; index += 1) {
    data[index] = Math.random() * 2 - 1
  }

  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900

  const gain = context.createGain()
  gain.gain.value = 0.025

  source.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)
  source.start()

  audioContextRef.current = context
  audioNodesRef.current = { source }
}

function stopCabinNoise(
  audioContextRef: React.MutableRefObject<AudioContext | null>,
  audioNodesRef: React.MutableRefObject<{ source?: AudioBufferSourceNode } | null>
) {
  const source = audioNodesRef.current?.source
  const context = audioContextRef.current

  if (source) {
    try {
      source.stop()
    } catch {
      // noop
    }
  }

  if (context) {
    context.close().catch(() => undefined)
  }

  audioContextRef.current = null
  audioNodesRef.current = null
}
