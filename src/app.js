// @flow

/* global __DEV__ */

import './util/polyfills'

import { Client } from 'bugsnag-react-native'
import React, { Component } from 'react'
import { AppState, AsyncStorage, Platform, Text, TextInput } from 'react-native'
import BackgroundFetch from 'react-native-background-fetch'
import firebase from 'react-native-firebase'
import RNFS from 'react-native-fs'
import PushNotification from 'react-native-push-notification'
import { Provider } from 'react-redux'
import { sprintf } from 'sprintf-js'

import ENV from '../env.json'
import * as Constants from './constants/indexConstants.js'
import configureStore from './lib/configureStore'
import s from './locales/strings.js'
import Main from './modules/MainConnector'
import { log, logToServer } from './util/logger'
import { makeCoreContext } from './util/makeContext.js'

global.bugsnag = new Client(ENV.BUGSNAG_API_KEY)

const store: {} = configureStore({})

const perfTimers = {}
const perfCounters = {}

console.log('***********************')
console.log('App directory: ' + RNFS.DocumentDirectoryPath)
console.log('***********************')

global.clog = console.log
if (ENV.USE_FIREBASE) {
  global.firebase = firebase
}

const IGNORED_WARNINGS = ['slowlog', 'Setting a timer for a long period of time']
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

const enableWhyDidYouUpdate = false

if (__DEV__ && enableWhyDidYouUpdate) {
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

const PERF_LOGGING_ONLY = false

if (PERF_LOGGING_ONLY) {
  // $FlowFixMe: suppressing this error until we can find a workaround
  console.log = () => {}
}

// $FlowFixMe: suppressing this error until we can find a workaround
global.pnow = function (label: string) {
  clog('PTIMER PNOW: ' + label + ':' + Date.now())
}

// $FlowFixMe: suppressing this error until we can find a workaround
global.pstart = function (label: string) {
  // $FlowFixMe: suppressing this error until we can find a workaround
  if (typeof perfTimers[label] === 'undefined') {
    perfTimers[label] = Date.now()
  } else {
    clog('PTIMER Error: PTimer already started')
  }
}

// $FlowFixMe: suppressing this error until we can find a workaround
global.pend = function (label: string) {
  // $FlowFixMe: suppressing this error until we can find a workaround
  if (typeof perfTimers[label] === 'number') {
    const elapsed = Date.now() - perfTimers[label]
    clog('PTIMER: ' + label + ': ' + elapsed + 'ms')
    perfTimers[label] = undefined
  } else {
    clog('PTIMER Error: PTimer not started')
  }
}

// $FlowFixMe: suppressing this error until we can find a workaround
global.pcount = function (label: string) {
  // $FlowFixMe: suppressing this error until we can find a workaround
  if (typeof perfCounters[label] === 'undefined') {
    perfCounters[label] = 1
  } else {
    perfCounters[label] = perfCounters[label] + 1
    if (perfCounters[label] % 10 === 0) {
      clog('PTIMER PCOUNT: ' + label + ': ' + perfCounters[label])
    }
  }
}

BackgroundFetch.configure(
  {
    minimumFetchInterval: 15,
    stopOnTerminate: false,
    startOnBoot: true
  },
  async () => {
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
    makeCoreContext().then(async context => {
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
    })
    await AsyncStorage.setItem(Constants.LOCAL_STORAGE_BACKGROUND_PUSH_KEY, now.toString())

    // Required: Signal completion of your task to native code
    // If you fail to do this, the OS can terminate your app
    // or assign battery-blame for consuming too much background-time
    BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA)
  },
  error => {
    console.log('RNBackgroundFetch failed to start')
    console.log(error)
  }
)

function _handleAppStateChange () {
  console.log('appStateLog: ', AppState.currentState)
}
function _handleSingleAppStateChange () {
  if (AppState.currentState === 'background') {
    AppState.removeEventListener('change', _handleSingleAppStateChange)
  }
}
export default class App extends Component<{}> {
  componentDidMount () {
    console.log('appStateLog: Component Mounted', AppState.currentState)
    AppState.addEventListener('change', _handleAppStateChange)
    if (Platform.OS === Constants.IOS) {
    } else {
      AppState.addEventListener('change', _handleSingleAppStateChange)
    }
  }

  render () {
    return (
      <Provider store={store}>
        <Main />
      </Provider>
    )
  }
}
