export interface DisplayTime {
  value: number
  measurement: 'seconds' | 'minutes' | 'hours' | 'days'
}

const MINUTE = 60
const HOUR = 60 * 60
const DAY = 24 * 60 * 60

export function secondsToDisplay(seconds: number): DisplayTime {
  if (seconds < MINUTE) {
    return {
      measurement: 'seconds',
      value: Math.round(seconds)
    }
  } else if (seconds < HOUR) {
    return {
      measurement: 'minutes',
      value: Math.round(seconds / MINUTE)
    }
  } else if (seconds < DAY) {
    return {
      measurement: 'hours',
      value: Math.round(seconds / HOUR)
    }
  } else {
    return {
      measurement: 'days',
      value: Math.round(seconds / DAY)
    }
  }
}

export function displayToSeconds(time: DisplayTime): number {
  switch (time.measurement) {
    case 'seconds':
      return time.value
    case 'minutes':
      return time.value * MINUTE
    case 'hours':
      return time.value * HOUR
    case 'days':
    default:
      return time.value * DAY
  }
}
