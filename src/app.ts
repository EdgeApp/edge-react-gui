/* global __DEV__ */

/**
 * Uncomment next line to get perfomance logging of component
 * rerenders
 */
// import './wdyr'
import NetInfo from '@react-native-community/netinfo'
import * as Sentry from '@sentry/react-native'
import { Buffer } from 'buffer'
import { LogBox } from 'react-native'
import { getVersion } from 'react-native-device-info'
import RNFS from 'react-native-fs'

import { initDeviceSettings } from './actions/DeviceSettingsActions'
import { ENV } from './env'
import type { NumberMap } from './types/types'
import { log, logToServer } from './util/logger'
import { initCoinrankList, initInfoServer } from './util/network'

export type Environment = 'development' | 'testing' | 'production'

const appVersion = getVersion()
const environment: Environment =
  __DEV__ || appVersion === '99.99.99'
    ? 'development'
    : appVersion.includes('-')
    ? 'testing'
    : 'production'

if (ENV.SENTRY_ORGANIZATION_SLUG.includes('SENTRY_ORGANIZATION')) {
  console.log('Sentry keys not set. Sentry disabled.')
} else {
  Sentry.init({
    dsn: ENV.SENTRY_DSN_URL,
    tracesSampleRate:
      environment === 'production' || environment === 'testing' ? 0.2 : 1.0,
    maxBreadcrumbs: 25,
    environment,

    // Initialize Sentry within native iOS and Android code so we can catch crashes at
    // early app startup.
    autoInitializeNativeSdk: false,

    integrations: [
      Sentry.breadcrumbsIntegration({
        console: false
      })
    ]
  })
}

// Uncomment the next line to remove popup warning/error boxes.
// LogBox.ignoreAllLogs()
LogBox.ignoreLogs([
  'Require cycle:',
  'Attempted to end a Span which has already ended.'
])

// Mute specific console output types.
// Useful for debugging using console output, i.e. mute everything but `debug`
for (const consoleOutputType of ENV.MUTE_CONSOLE_OUTPUT) {
  switch (consoleOutputType) {
    case 'log':
      console.log = () => {}
      break
    case 'info':
      console.info = () => {}
      break
    case 'warn':
      console.warn = () => {}
      break
    case 'error':
      console.error = () => {}
      break
    case 'debug':
      console.debug = () => {}
      break
    case 'trace':
      console.trace = () => {}
      break
    case 'group':
      console.group = () => {}
      break
    case 'groupCollapsed':
      console.groupCollapsed = () => {}
      break
    case 'groupEnd':
      console.groupEnd = () => {}
      break
  }
}

const ENABLE_PERF_LOGGING = false
const PERF_LOGGING_ONLY = false

const perfTimers = new Map<string, number>()
const perfCounters: NumberMap = {}
const perfTotals: NumberMap = {}

console.log('***********************')
console.log('App directory: ' + RNFS.DocumentDirectoryPath)
console.log('***********************')

// @ts-expect-error - Adding clog to global scope for debugging
global.clog = console.log

if (!__DEV__) {
  console.log = log
  console.info = log
  console.warn = log
  console.error = log
}

if (ENV.LOG_SERVER != null) {
  console.log = function () {
    logToServer(arguments)
  }

  console.info = console.log

  console.warn = console.log

  console.error = console.log
}

const clog = console.log

if (PERF_LOGGING_ONLY) {
  console.log = () => {}
}

if (ENABLE_PERF_LOGGING) {
  // @ts-expect-error - Adding perf timing to global scope
  if (global.nativePerformanceNow == null && window?.performance != null) {
    // @ts-expect-error - Adding perf timing to global scope
    global.nativePerformanceNow = () => window.performance.now()
  }
  const makeDate = (): string => {
    const d = new Date(Date.now())
    const h = ('0' + d.getHours().toString()).slice(-2)
    const m = ('0' + d.getMinutes().toString()).slice(-2)
    const s = ('0' + d.getSeconds().toString()).slice(-2)
    const ms = ('00' + d.getMilliseconds().toString()).slice(-3)
    return `${h}:${m}:${s}.${ms}`
  }

  // @ts-expect-error - Adding perf timing to global scope
  global.pnow = function (label: string): void {
    const d = makeDate()
    clog(`${d} PTIMER PNOW: ${label}`)
  }

  // @ts-expect-error - Adding perf timing to global scope
  global.pstart = function (label: string): void {
    const d = makeDate()
    if (perfTotals[label] === 0 || perfTotals[label] == null) {
      perfTotals[label] = 0
      perfCounters[label] = 0
    }
    if (typeof perfTimers.get(label) === 'undefined') {
      // @ts-expect-error - Adding perf timing to global scope
      perfTimers.set(label, global.nativePerformanceNow())
    } else {
      clog(`${d}: PTIMER Error: PTimer already started: ${label}`)
    }
  }

  // @ts-expect-error - Adding perf timing to global scope
  global.pend = function (label: string): void {
    const d = makeDate()
    const timer = perfTimers.get(label)
    if (typeof timer === 'number') {
      // @ts-expect-error - Adding perf timing to global scope
      const elapsed = global.nativePerformanceNow() - timer
      perfTotals[label] += elapsed
      perfCounters[label]++
      clog(
        `${d}: PTIMER ${label}:${elapsed}ms total:${perfTotals[label]}ms count:${perfCounters[label]}`
      )
      perfTimers.delete(label)
    } else {
      clog(`${d}: PTIMER Error: PTimer not started: ${label}`)
    }
  }

  // @ts-expect-error - Adding perf timing to global scope
  global.pcount = function (label: string): void {
    const d = makeDate()
    if (typeof perfCounters[label] === 'undefined') {
      perfCounters[label] = 1
    } else {
      perfCounters[label] = perfCounters[label] + 1
    }
    if (perfCounters[label] % 1 === 0) {
      clog(`${d}: PTIMER PCOUNT ${label}:${perfCounters[label]}`)
    }
  }
} else {
  // @ts-expect-error - Adding perf timing to global scope
  global.pnow = function (_label: string): void {}
  // @ts-expect-error - Adding perf timing to global scope
  global.pstart = function (_label: string): void {}
  // @ts-expect-error - Adding perf timing to global scope
  global.pend = function (_label: string): void {}
  // @ts-expect-error - Adding perf timing to global scope
  global.pcount = function (_label: string): void {}
}

const realFetch = fetch
// @ts-expect-error - Overriding global fetch for error tracking
// eslint-disable-next-line no-global-assign
fetch = async (...args: Parameters<typeof fetch>): ReturnType<typeof fetch> => {
  return await realFetch(...args).catch((e: unknown) => {
    const error = e as Error
    const input = args[0]
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.href
        : input.url
    Sentry.addBreadcrumb({
      event_id: error.name,
      message: error.message,
      data: { url }
    })
    throw e
  })
}

initDeviceSettings().catch((err: unknown) => {
  console.log(err)
})

// Set up network state change listener to refresh data when connectivity is restored
let previousConnectionState = false
NetInfo.addEventListener(state => {
  const currentConnectionState = state.isConnected ?? false
  if (!previousConnectionState && currentConnectionState) {
    console.log('Network connected, refreshing info and coinrank...')
    initInfoServer().catch((err: unknown) => {
      console.log(err)
    })
    initCoinrankList().catch((err: unknown) => {
      console.log(err)
    })
  }
  previousConnectionState = currentConnectionState
})

global.Buffer ??= Buffer
