// @flow
/* global __DEV__ */

import Bugsnag from '@bugsnag/react-native'
import { asObject, asString } from 'cleaners'
import { LogBox, Platform, Text, TextInput } from 'react-native'
import RNFS from 'react-native-fs'

import ENV from '../env.json'
import { changeTheme, getTheme } from './components/services/ThemeContext.js'
import { log, logToServer } from './util/logger'

Bugsnag.start({
  apiKey: ENV.BUGSNAG_API_KEY,
  onError: event => {
    log(`Bugsnag Device ID: ${event.device.id ?? ''}`)
    return event
  }
})

const asServerDetails = asObject({
  host: asString,
  port: asString
})

const ENABLE_PERF_LOGGING = false
const PERF_LOGGING_ONLY = false

const perfTimers = {}
const perfCounters = {}
const perfTotals = {}

console.log('***********************')
console.log('App directory: ' + RNFS.DocumentDirectoryPath)
console.log('***********************')

global.clog = console.log

// TODO: Remove isMounted from IGNORED_WARNINGS once we upgrade to RN 0.57
const IGNORED_WARNINGS = ['slowlog', 'Setting a timer for a long period of time', 'Warning: isMounted(...) is deprecated']
// $FlowExpectedError
console.ignoredYellowBox = IGNORED_WARNINGS

// Ignore errors and warnings(used for device testing)
if (ENV.DISABLE_WARNINGS) LogBox.ignoreAllLogs()

global.OS = Platform.OS
// Disable the font scaling
if (!Text.defaultProps) {
  Text.defaultProps = {}
}
Text.defaultProps.allowFontScaling = false

if (!TextInput.defaultProps) {
  TextInput.defaultProps = {}
}
TextInput.defaultProps.allowFontScaling = false

// $FlowFixMe
if (!__DEV__) {
  // TODO: Fix logger to append data vs read/modify/write
  // $FlowFixMe
  console.log = log
  // $FlowFixMe
  console.info = log
  // $FlowFixMe
  console.warn = log
  // $FlowFixMe
  console.error = log
}

if (ENV.LOG_SERVER) {
  // $FlowFixMe: suppressing this error until we can find a workaround
  console.log = function () {
    logToServer(arguments)
  }
  // $FlowFixMe
  console.info = console.log
  // $FlowFixMe
  console.warn = console.log
  // $FlowFixMe
  console.error = console.log
}

const clog = console.log

if (PERF_LOGGING_ONLY) {
  // $FlowFixMe: suppressing this error until we can find a workaround
  console.log = () => {}
}

if (ENABLE_PERF_LOGGING) {
  if (!global.nativePerformanceNow && window && window.performance) {
    global.nativePerformanceNow = () => window.performance.now()
  }
  const makeDate = () => {
    const d = new Date(Date.now())
    const h = ('0' + d.getHours().toString()).slice(-2)
    const m = ('0' + d.getMinutes().toString()).slice(-2)
    const s = ('0' + d.getSeconds().toString()).slice(-2)
    const ms = ('00' + d.getMilliseconds().toString()).slice(-3)
    return `${h}:${m}:${s}.${ms}`
  }

  global.pnow = function (label: string) {
    const d = makeDate()
    clog(`${d} PTIMER PNOW: ${label}`)
  }

  global.pstart = function (label: string) {
    const d = makeDate()
    if (!perfTotals[label]) {
      perfTotals[label] = 0
      perfCounters[label] = 0
    }
    if (typeof perfTimers[label] === 'undefined') {
      perfTimers[label] = global.nativePerformanceNow()
    } else {
      clog(`${d}: PTIMER Error: PTimer already started: ${label}`)
    }
  }

  global.pend = function (label: string) {
    const d = makeDate()
    if (typeof perfTimers[label] === 'number') {
      const elapsed = global.nativePerformanceNow() - perfTimers[label]
      perfTotals[label] += elapsed
      perfCounters[label]++
      clog(`${d}: PTIMER ${label}:${elapsed}ms total:${perfTotals[label]}ms count:${perfCounters[label]}`)
      perfTimers[label] = undefined
    } else {
      clog(`${d}: PTIMER Error: PTimer not started: ${label}`)
    }
  }

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
  global.pnow = function (label: string) {}
  global.pstart = function (label: string) {}
  global.pend = function (label: string) {}
  global.pcount = function (label: string) {}
}

const realFetch = fetch
fetch = (...args: any) => {
  return realFetch(...args).catch(e => {
    Bugsnag.leaveBreadcrumb('realFetchError', {
      url: args[0],
      errorName: e.name,
      errorMsg: e.message
    })
    console.log(`realFetchError: ${args[0]} ${e.name} ${e.message}`)
    throw e
  })
}

if (ENV.DEBUG_THEME === true) {
  const themeFunc = async () => {
    try {
      const oldTheme = getTheme()
      const { host, port } = asServerDetails(ENV.THEME_SERVER)
      const url = `${host}:${port}/theme`
      console.log('THEME:\n' + JSON.stringify(oldTheme, null, 2))
      const postOptions = {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(oldTheme)
      }
      realFetch(url, postOptions)
      const getOptions = {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
      }
      let themeJson = ''
      setInterval(async () => {
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
        } catch (e) {
          console.log(`Failed get theme`, e.message)
        }
      }, 3000)
    } catch (e) {
      console.log(`Failed to access theme server`)
    }
  }
  themeFunc()
}
