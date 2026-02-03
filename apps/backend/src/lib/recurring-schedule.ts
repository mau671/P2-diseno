const TIME_ZONE = 'America/Costa_Rica'
const MAX_SCHEDULE_LOOKAHEAD_DAYS = 548

export type TimeWindow = { start: string; end: string }

export const isValidTimeString = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)

export const parseTimeToMinutes = (value: string) => {
  if (!isValidTimeString(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export const normalizeTimeWindows = (input: unknown): TimeWindow[] => {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => ({
      start: typeof item?.start === 'string' ? item.start.trim() : '',
      end: typeof item?.end === 'string' ? item.end.trim() : ''
    }))
    .filter((item) => isValidTimeString(item.start) && isValidTimeString(item.end))
}

const uniqueNumbers = (values: number[]) => Array.from(new Set(values))

export const normalizeDays = (input: unknown, min: number, max: number) => {
  if (!Array.isArray(input)) return []
  const numbers = input
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= min && value <= max)
  return uniqueNumbers(numbers).sort((a, b) => a - b)
}

export const formatDateInTz = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)

export const formatTimeInTz = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)

export const buildDateTimeInTz = (dateString: string, timeString: string) =>
  new Date(`${dateString}T${timeString}:00-06:00`)

const getDayOfWeek = (dateString: string) =>
  new Date(`${dateString}T00:00:00-06:00`).getUTCDay()

const getDayOfMonth = (dateString: string) =>
  Number(dateString.split('-')[2] ?? 0)

const monthsDiff = (startDate: string, candidateDate: string) => {
  const [sy, sm] = startDate.split('-').map(Number)
  const [cy, cm] = candidateDate.split('-').map(Number)
  return (cy - sy) * 12 + (cm - sm)
}

const daysDiff = (startDate: string, candidateDate: string) => {
  const start = new Date(`${startDate}T00:00:00-06:00`)
  const candidate = new Date(`${candidateDate}T00:00:00-06:00`)
  return Math.floor((candidate.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
}

const matchesScheduleDay = (params: {
  candidateDate: string
  startDate: string
  intervalUnit: string
  intervalValue: number
  daysOfWeek: number[]
  daysOfMonth: number[]
}) => {
  const { candidateDate, startDate, intervalUnit, intervalValue, daysOfWeek, daysOfMonth } = params
  if (intervalUnit === 'week') {
    const diff = daysDiff(startDate, candidateDate)
    if (diff < 0) return false
    const weekIndex = Math.floor(diff / 7)
    if (weekIndex % intervalValue !== 0) return false
    const day = getDayOfWeek(candidateDate)
    return daysOfWeek.includes(day)
  }
  if (intervalUnit === 'month') {
    const diff = monthsDiff(startDate, candidateDate)
    if (diff < 0) return false
    if (diff % intervalValue !== 0) return false
    const day = getDayOfMonth(candidateDate)
    return daysOfMonth.includes(day)
  }
  return false
}

export const validateSchedule = (params: {
  intervalUnit: string
  intervalValue: number
  daysOfWeek: number[]
  daysOfMonth: number[]
  timeWindows: TimeWindow[]
}) => {
  const { intervalUnit, intervalValue, daysOfWeek, daysOfMonth, timeWindows } = params
  if (!['week', 'month'].includes(intervalUnit)) {
    return { ok: false, error: 'interval_unit must be week or month' }
  }
  if (!Number.isInteger(intervalValue) || intervalValue < 1) {
    return { ok: false, error: 'interval_value must be >= 1' }
  }
  if (intervalUnit === 'week' && daysOfWeek.length === 0) {
    return { ok: false, error: 'days_of_week is required for weekly schedules' }
  }
  if (intervalUnit === 'month' && daysOfMonth.length === 0) {
    return { ok: false, error: 'days_of_month is required for monthly schedules' }
  }
  if (!timeWindows.length) {
    return { ok: false, error: 'time_windows is required' }
  }
  for (const window of timeWindows) {
    const start = parseTimeToMinutes(window.start)
    const end = parseTimeToMinutes(window.end)
    if (start === null || end === null || start >= end) {
      return { ok: false, error: 'time_windows must include valid start and end times' }
    }
  }
  return { ok: true }
}

export const validateFirstRun = (params: {
  nextRunAt: Date
  startDate: string
  intervalUnit: string
  intervalValue: number
  daysOfWeek: number[]
  daysOfMonth: number[]
  timeWindows: TimeWindow[]
}) => {
  const { nextRunAt, startDate, intervalUnit, intervalValue, daysOfWeek, daysOfMonth, timeWindows } = params
  const candidateDate = formatDateInTz(nextRunAt)
  if (!matchesScheduleDay({ candidateDate, startDate, intervalUnit, intervalValue, daysOfWeek, daysOfMonth })) {
    return { ok: false, error: 'next_run_at does not match schedule day' }
  }
  const time = formatTimeInTz(nextRunAt)
  const minutes = parseTimeToMinutes(time)
  if (minutes === null) {
    return { ok: false, error: 'next_run_at time is invalid' }
  }
  const matchesWindow = timeWindows.some((window) => {
    const start = parseTimeToMinutes(window.start)
    const end = parseTimeToMinutes(window.end)
    return start !== null && end !== null && minutes >= start && minutes < end
  })
  if (!matchesWindow) {
    return { ok: false, error: 'next_run_at time is outside time windows' }
  }
  return { ok: true }
}

export const computeNextRunAt = (params: {
  startDate: string
  intervalUnit: string
  intervalValue: number
  daysOfWeek: number[]
  daysOfMonth: number[]
  timeWindows: TimeWindow[]
  fromDate: Date
}) => {
  const { startDate, intervalUnit, intervalValue, daysOfWeek, daysOfMonth, timeWindows, fromDate } = params
  const fromDateStr = formatDateInTz(fromDate)
  const fromTime = formatTimeInTz(fromDate)
  const fromMinutes = parseTimeToMinutes(fromTime) ?? 0
  const sortedWindows = [...timeWindows].sort((a, b) => {
    const aMinutes = parseTimeToMinutes(a.start) ?? 0
    const bMinutes = parseTimeToMinutes(b.start) ?? 0
    return aMinutes - bMinutes
  })

  const base = new Date(`${fromDateStr}T00:00:00-06:00`)
  for (let offset = 0; offset <= MAX_SCHEDULE_LOOKAHEAD_DAYS; offset += 1) {
    const candidate = new Date(base.getTime() + offset * 24 * 60 * 60 * 1000)
    const candidateDate = formatDateInTz(candidate)
    if (!matchesScheduleDay({ candidateDate, startDate, intervalUnit, intervalValue, daysOfWeek, daysOfMonth })) {
      continue
    }

    for (const window of sortedWindows) {
      const startMinutes = parseTimeToMinutes(window.start) ?? 0
      const endMinutes = parseTimeToMinutes(window.end) ?? 0
      if (endMinutes <= startMinutes) continue
      if (candidateDate === fromDateStr && startMinutes <= fromMinutes) {
        continue
      }
      return buildDateTimeInTz(candidateDate, window.start)
    }
  }
  return null
}

export const TIME_ZONE_ID = TIME_ZONE
