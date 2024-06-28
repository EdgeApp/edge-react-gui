import { PerfEvent } from 'edge-login-ui-rn'
import performance, { PerformanceEntry, PerformanceObserver } from 'react-native-performance'

import { ENV } from './env'

//
// Logging
//

/**
 * Log the 'measure' performance entries observed throughout the app.
 *
 * This is a single logging location for all performance measurements, so that
 * way the app can just use the performance API and not worry about logging, and
 * the destination for these logs can be trivially changed and managed for all
 * performance related logging needs.
 */
new PerformanceObserver(list => {
  const entries = list.getEntries()
  const measureEntries = entries.filter(entry => entry.entryType === 'measure')

  // Log the measure entries:
  measureEntries.forEach(entry => {
    const detail = 'detail' in entry && entry.detail != null ? entry.detail : ''
    console.log(`PERF:`, entry.name, `${entry.duration}ms`, detail)
  })

  // Clear measure entries:
  const names = measureEntries.map(entries => entries.name)
  names.map(name => performance.clearMeasures(name))
}).observe({ entryTypes: ['measure'] })

//
// Native Measurements
//

// Launch:
new PerformanceObserver(list => {
  const entries = list.getEntries()
  const hasLaunchFinished = entries.some(entry => entry.name === 'nativeLaunchEnd')
  const hasBundleFinished = entries.some(entry => entry.name === 'runJsBundleEnd')

  if (hasLaunchFinished && hasBundleFinished) {
    performance.measure('nativeLaunch', 'nativeLaunchStart', 'nativeLaunchEnd')
    performance.measure('runJsBundle', 'runJsBundleStart', 'runJsBundleEnd')
    performance.measure('fullLaunch', 'nativeLaunchStart', 'runJsBundleEnd')

    // Clear mark entries:
    performance.clearMarks('nativeLaunchStart')
    performance.clearMarks('nativeLaunchEnd')
    performance.clearMarks('runJsBundleStart')
    performance.clearMarks('runJsBundleEnd')
  }
}).observe({ type: 'react-native-mark', buffered: true })

//
// App Tracking Measurements
//

const measurements = [
  // GUI Login (end-to-end):
  markerMeasurement('loginFull', 'loginBegin', 'loginEnd'),
  // Pin Login:
  markerMeasurement('pinLogin', 'pinLoginBegin', 'pinLoginEnd'),
  // Password Login:
  markerMeasurement('passwordLogin', 'passwordLoginBegin', 'passwordLoginEnd')
]

// Observe for all markers and measure them:
new PerformanceObserver(list => {
  const entries = list.getEntries()
  measurements.forEach(fn => fn(entries))
}).observe({ type: 'mark', buffered: true })

//
// Login UI Performance Markers
//

export function performanceMarkersFromLoginUiPerfEvents(event: PerfEvent): void {
  switch (event.name) {
    case 'passwordLoginBegin':
      performance.mark('loginBegin')
      performance.mark('passwordLoginBegin')
      break
    case 'passwordLoginEnd':
      performance.mark('passwordLoginEnd', { detail: { isSuccessful: event.error == null } })
      break

    case 'pinLoginBegin':
      performance.mark('loginBegin')
      performance.mark('pinLoginBegin')
      break
    case 'pinLoginEnd':
      performance.mark('pinLoginEnd', { detail: { isSuccessful: event.error == null } })
      break

    default:
    // Do nothing
  }
}

//
// Utilities
//

function markerMeasurement(measureName: string, startName: string, endName: string) {
  return (entries: PerformanceEntry[]) => {
    const endMark = entries.find(entry => entry.name === endName)

    if (endMark != null) {
      const endMarkDetail = 'detail' in endMark ? endMark.detail : {}
      const [startMark] = performance.getEntriesByName(startName)

      // Measure the start and end markers if they exist:
      if (startMark != null) {
        performance.measure(measureName, {
          start: startName,
          end: endName,
          detail: endMarkDetail
        })
      }

      // Clear the markers:
      performance.clearMarks(startName)
      performance.clearMarks(endName)
    }
  }
}

const perfDate = () => new Date().toISOString().slice(11, 23)

const INTERVAL_SECONDS = 3
const LOG_FREQUENCY_SECONDS = 0

const counters: { [counterTag: string]: { callTimes: number[]; lastLogTime: number } } = {}

export const rateCounter = (tag: string) => {
  if (!ENV.ENABLE_RATE_COUNTERS) return

  const currentTime = Date.now()
  if (counters[tag] == null) {
    counters[tag] = { callTimes: [], lastLogTime: 0 }
  }
  const counter = counters[tag]
  counter.callTimes.push(currentTime)

  // Remove call times older than the interval
  const intervalAgo = currentTime - INTERVAL_SECONDS * 1000
  counter.callTimes = counter.callTimes.filter(time => time >= intervalAgo)

  // Check if more than 1 second has elapsed since the last log
  if (currentTime - counter.lastLogTime >= LOG_FREQUENCY_SECONDS * 1000) {
    const recentCalls = counter.callTimes.filter(time => time >= intervalAgo)
    const callsPerSecond = recentCalls.length / INTERVAL_SECONDS
    console.log(`rc: ${perfDate()} ${tag} calls:${recentCalls.length} cps:${callsPerSecond.toFixed(2)}`)
    counter.lastLogTime = currentTime
  }
}
