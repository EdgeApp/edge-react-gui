import performance, { PerformanceObserver } from 'react-native-performance'

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
