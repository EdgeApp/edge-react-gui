/* global __DEV__ */

/**
 * Uncomment next line to get perfomance logging of component
 * rerenders
 */
// import './wdyr'
import NetInfo from '@react-native-community/netinfo'
import * as Sentry from '@sentry/react-native'
import { Buffer } from 'buffer'
import { asObject, asString } from 'cleaners'
import { Appearance, InteractionManager, LogBox, Platform } from 'react-native'
import { getVersion } from 'react-native-device-info'
import RNFS from 'react-native-fs'

import {
  awaitDeviceSettingsDisk,
  getDeviceSettings
} from './actions/DeviceSettingsActions'
import { showError } from './components/services/AirshipInstance'
import { changeTheme, getTheme } from './components/services/ThemeContext'
import { CONFIG } from './config'
import { KEYS } from './keys'
import { config } from './theme/appConfig'
import type { NumberMap } from './types/types'
import { initAttestation } from './util/attestation'
import { willSignInfoRollup } from './util/edgeApiSigner'
import { log, logToServer } from './util/logger'
import { INFO_TEST_SERVER, shouldUseTestServers } from './util/maestro'
import {
  configureNetwork,
  initCoinrankList,
  initInfoServer
} from './util/network'
import { getOsVersion } from './util/rnUtils'
import { runOnce } from './util/runOnce'
import { checkAppVersion } from './util/versionCheck'

// `CONFIG.INFO_SERVER` overrides the production info servers,
// e.g. to point a debug build at a local info server. Absent in production
// builds.
configureNetwork({
  infoServers:
    CONFIG.INFO_SERVER != null && CONFIG.INFO_SERVER.length > 0
      ? CONFIG.INFO_SERVER
      : shouldUseTestServers()
      ? [INFO_TEST_SERVER]
      : undefined,
  referralServers: config.referralServers ?? [],
  notificationServers: config.notificationServers
})

export type Environment = 'development' | 'testing' | 'production'

const appVersion = getVersion()
const environment: Environment =
  __DEV__ || appVersion === '99.99.99'
    ? 'development'
    : appVersion.includes('-')
    ? 'testing'
    : 'production'

if (KEYS.SENTRY_ORGANIZATION_SLUG.includes('SENTRY_ORGANIZATION')) {
  console.log('Sentry keys not set. Sentry disabled.')
} else {
  Sentry.init({
    dsn: KEYS.SENTRY_DSN_URL,
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

// Set CONFIG.LOGBOX_DISABLE to remove popup warning/error boxes.
if (CONFIG.LOGBOX_DISABLE) {
  LogBox.ignoreAllLogs()
} else {
  LogBox.ignoreLogs([
    'Require cycle:',
    'Attempted to end a Span which has already ended.'
  ])
}

// Mute specific console output types.
// Useful for debugging using console output, i.e. mute everything but `debug`
for (const consoleOutputType of CONFIG.MUTE_CONSOLE_OUTPUT) {
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

const asServerDetails = asObject({
  host: asString,
  port: asString
})

const ENABLE_PERF_LOGGING = false
const PERF_LOGGING_ONLY = false

const perfTimers = new Map<string, number>()
const perfCounters: NumberMap = {}
const perfTotals: NumberMap = {}

console.log('***********************')
console.log('App directory: ' + RNFS.DocumentDirectoryPath)
console.log('***********************')

// @ts-expect-error: untyped global clog
global.clog = console.log

if (!__DEV__) {
  console.log = log
  console.info = log
  console.warn = log
  console.error = log
}

if (CONFIG.LOG_SERVER != null) {
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
  // @ts-expect-error: untyped global nativePerformanceNow
  if (global.nativePerformanceNow == null && window?.performance != null) {
    // @ts-expect-error: untyped global nativePerformanceNow
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

  // @ts-expect-error: untyped global pnow
  global.pnow = function (label: string) {
    const d = makeDate()
    clog(`${d} PTIMER PNOW: ${label}`)
  }

  // @ts-expect-error: untyped global pstart
  global.pstart = function (label: string) {
    const d = makeDate()
    if (perfTotals[label] == null || perfTotals[label] === 0) {
      perfTotals[label] = 0
      perfCounters[label] = 0
    }
    if (typeof perfTimers.get(label) === 'undefined') {
      // @ts-expect-error: untyped global nativePerformanceNow
      perfTimers.set(label, global.nativePerformanceNow())
    } else {
      clog(`${d}: PTIMER Error: PTimer already started: ${label}`)
    }
  }

  // @ts-expect-error: untyped global pend
  global.pend = function (label: string) {
    const d = makeDate()
    const timer = perfTimers.get(label)
    if (typeof timer === 'number') {
      // @ts-expect-error: untyped global nativePerformanceNow
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

  // @ts-expect-error: untyped global pcount
  global.pcount = function (label: string) {
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
  // @ts-expect-error: untyped global pnow
  global.pnow = function (label: string) {}
  // @ts-expect-error: untyped global pstart
  global.pstart = function (label: string) {}
  // @ts-expect-error: untyped global pend
  global.pend = function (label: string) {}
  // @ts-expect-error: untyped global pcount
  global.pcount = function (label: string) {}
}

const realFetch = fetch
// @ts-expect-error: reassigning global fetch
// eslint-disable-next-line no-global-assign
fetch = async (...args: any) => {
  // @ts-expect-error: reassigned fetch return type
  return await realFetch(...args).catch((e: unknown) => {
    const err = e as { name?: string; message?: string }
    Sentry.addBreadcrumb({
      event_id: err.name,
      message: err.message,
      data: args[0]
    })
    throw e
  })
}

if (CONFIG.DEBUG_THEME) {
  const themeFunc = async (): Promise<void> => {
    try {
      const oldTheme = getTheme()
      const { host, port } = asServerDetails(CONFIG.THEME_SERVER)
      const url = `${host}:${port}/theme`
      console.log('THEME:\n' + JSON.stringify(oldTheme, null, 2))
      const postOptions = {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(oldTheme)
      }
      await realFetch(url, postOptions)
      const getOptions = {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
      }
      let themeJson = ''
      const updateTheme = async (): Promise<void> => {
        try {
          const response = await realFetch(url, getOptions)
          const overrideTheme = await response.json()
          const newTheme = { ...oldTheme, ...overrideTheme }
          const newThemeJson = JSON.stringify(newTheme, null, 2)
          if (newThemeJson !== themeJson) {
            console.log('Theme changed!')
            changeTheme(newTheme)
            themeJson = newThemeJson
          }
        } catch (e: any) {
          console.log(`Failed get theme`, e.message)
        }
      }
      setInterval(() => {
        updateTheme().catch((error: unknown) => {
          showError(error)
        })
      }, 3000)
    } catch (e: any) {
      console.log(`Failed to access theme server`)
    }
  }
  themeFunc().catch((err: unknown) => {
    console.error(err)
  })
}

// Theme initialization and system theme listener. Prefer the on-disk
// themeMode even when the writer-facing init timed out; bound the wait so a
// hung disk cannot delay boot forever.
const THEME_SETTINGS_WAIT_MS = 3000
Promise.race([
  awaitDeviceSettingsDisk(),
  new Promise<void>(resolve => {
    setTimeout(resolve, THEME_SETTINGS_WAIT_MS)
  })
])
  .then(() => {
    const { themeMode } = getDeviceSettings()

    // Apply theme based on mode setting at startup
    let shouldUseLightTheme = false
    if (themeMode === 'light') {
      shouldUseLightTheme = true
    } else if (themeMode === 'system') {
      shouldUseLightTheme = Appearance.getColorScheme() !== 'dark'
    }
    // Only change theme if light mode is needed (dark is already the default)
    if (shouldUseLightTheme) {
      // Defer until after React render cycle completes
      InteractionManager.runAfterInteractions(() => {
        changeTheme(config.lightTheme)
      })
    }

    // Global listener for OS theme changes (active when themeMode is 'system')
    Appearance.addChangeListener(({ colorScheme }) => {
      const { themeMode: currentMode } = getDeviceSettings()
      if (currentMode === 'system') {
        InteractionManager.runAfterInteractions(() => {
          const newTheme =
            colorScheme === 'dark' ? config.darkTheme : config.lightTheme
          changeTheme(newTheme)
        })
      }
    })
  })
  .catch((err: unknown) => {
    console.log(err)
  })

// Set up network state change listener to refresh data when connectivity is restored
let previousConnectionState = false
NetInfo.addEventListener(state => {
  const currentConnectionState = state.isConnected ?? false
  if (!previousConnectionState && currentConnectionState) {
    console.log('Network connected, refreshing info and coinrank...')
    // Start attestation at reconnect (idempotent); previously lived in
    // initInfoServer before network.ts was made Node-safe.
    initAttestation()
    initInfoServer({
      osType: Platform.OS.toLowerCase(),
      osVersion: getOsVersion(),
      appVersion: getVersion(),
      appId: config.appId ?? 'edge',
      skipUnsignedLaunchFetch: willSignInfoRollup(),
      onRollup: async () => {
        await runOnce('checkAppVersion', checkAppVersion)
      }
    }).catch((err: unknown) => {
      console.log(err)
    })
    initCoinrankList().catch((err: unknown) => {
      console.log(err)
    })
  }
  previousConnectionState = currentConnectionState
})

global.Buffer ??= Buffer
