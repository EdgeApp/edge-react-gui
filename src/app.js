// @flow

/* global __DEV__ */

import './util/polyfills'

import { Client } from 'bugsnag-react-native'
import React, { Component } from 'react'
import { AsyncStorage, Platform, Text, TextInput } from 'react-native'
import BackgroundFetch from 'react-native-background-fetch'
import firebase from 'react-native-firebase'
import RNFS from 'react-native-fs'
import PushNotification from 'react-native-push-notification'
import { Provider } from 'react-redux'
import { sprintf } from 'sprintf-js'

import ENV from '../env.json'
import Main from './connectors/MainConnector'
import * as Constants from './constants/indexConstants.js'
import configureStore from './lib/configureStore'
import s from './locales/strings.js'
import { log, logToServer } from './util/logger'
import { makeCoreContext } from './util/makeContext.js'

const ENABLE_WHY_DID_YOU_UPDATE = false
const ENABLE_PERF_LOGGING = false
const PERF_LOGGING_ONLY = false

global.bugsnag = new Client(ENV.BUGSNAG_API_KEY)

const store: {} = configureStore({})

const perfTimers = {}
const perfCounters = {}
const perfTotals = {}

console.log('***********************')
console.log('App directory: ' + RNFS.DocumentDirectoryPath)
console.log('***********************')

global.clog = console.log
if (ENV.USE_FIREBASE) {
  global.firebase = firebase
}

// TODO: Remove isMounted from IGNORED_WARNINGS once we upgrade to RN 0.57
const IGNORED_WARNINGS = ['slowlog', 'Setting a timer for a long period of time', 'Warning: isMounted(...) is deprecated']
// $FlowExpectedError
console.ignoredYellowBox = IGNORED_WARNINGS

// $FlowFixMe
global.OS = Platform.OS
global.slowlogOptions = { threshold: 16 }
// Disable the font scaling
if (!Text.defaultProps) {
  Text.defaultProps = {}
}
Text.defaultProps.allowFontScaling = false

if (!TextInput.defaultProps) {
  TextInput.defaultProps = {}
}
TextInput.defaultProps.allowFontScaling = false

if (!__DEV__) {
  // TODO: Fix logger to append data vs read/modify/write
  // $FlowFixMe: suppressing this error until we can find a workaround
  console.log = log
  // $FlowFixMe: suppressing this error until we can find a workaround
  // console.log = () => {}
}

if (__DEV__ && ENABLE_WHY_DID_YOU_UPDATE) {
  const { whyDidYouUpdate } = require('why-did-you-update')
  whyDidYouUpdate(React)
}

if (ENV.LOG_SERVER) {
  // $FlowFixMe: suppressing this error until we can find a workaround
  console.log = function () {
    logToServer(arguments)
  }
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

  // $FlowFixMe: suppressing this error until we can find a workaround
  global.pnow = function (label: string) {
    const d = makeDate()
    clog(`${d} PTIMER PNOW: ${label}`)
  }

  // $FlowFixMe: suppressing this error until we can find a workaround
  global.pstart = function (label: string) {
    // $FlowFixMe: suppressing this error until we can find a workaround
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

  // $FlowFixMe: suppressing this error until we can find a workaround
  global.pend = function (label: string) {
    // $FlowFixMe: suppressing this error until we can find a workaround
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

  // $FlowFixMe: suppressing this error until we can find a workaround
  global.pcount = function (label: string) {
    // $FlowFixMe: suppressing this error until we can find a workaround
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

async function backgroundWorker () {
  console.log('appStateLog: running background task')
  const lastNotif = await AsyncStorage.getItem(Constants.LOCAL_STORAGE_BACKGROUND_PUSH_KEY)
  const now = new Date()
  if (lastNotif) {
    const lastNotifDate = new Date(lastNotif).getTime() / 1000
    const delta = now.getTime() / 1000 - lastNotifDate
    if (delta < Constants.PUSH_DELAY_SECONDS) {
      BackgroundFetch.finish()
      return
    }
  }
  const context = await makeCoreContext()
  try {
    const result = await context.fetchLoginMessages()
    const date = new Date(Date.now() + 1000)
    // for each key
    for (const key in result) {
      // skip loop if the property is from prototype
      if (!result.hasOwnProperty(key)) continue
      const obj = result[key]
      if (obj.otpResetPending) {
        if (Platform.OS === Constants.IOS) {
          PushNotification.localNotificationSchedule({
            title: s.strings.otp_notif_title,
            message: sprintf(s.strings.otp_notif_body, key),
            date
          })
        } else {
          PushNotification.localNotificationSchedule({
            message: s.strings.otp_notif_title,
            subText: sprintf(s.strings.otp_notif_body, key),
            date
          })
        }
      }
    }
  } catch (error) {
    global.bugsnag.notify(error)
    console.error(error)
  }
  await AsyncStorage.setItem(Constants.LOCAL_STORAGE_BACKGROUND_PUSH_KEY, now.toString())

  // Required: Signal completion of your task to native code
  // If you fail to do this, the OS can terminate your app
  // or assign battery-blame for consuming too much background-time
  BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA)
}

BackgroundFetch.configure(
  {
    minimumFetchInterval: 15,
    stopOnTerminate: false,
    startOnBoot: true
  },
  backgroundWorker,
  error => {
    console.log('RNBackgroundFetch failed to start')
    console.log(error)
  }
)

export default class App extends Component<{}> {
  render () {
    return (
      <Provider store={store}>
        <Main />
      </Provider>
    )
  }
}
