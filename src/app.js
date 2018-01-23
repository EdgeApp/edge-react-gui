// @flow
/* global __DEV__ */

import React, {Component} from 'react'
import {Provider} from 'react-redux'
import configureStore from './lib/configureStore'
import Main from './modules/MainConnector'
import {logToServer, log} from './util/logger'
import ENV from '../env.json'
import RNFS from 'react-native-fs'
import {Platform} from 'react-native'
import {makeCoreContext} from './util/makeContext.js'
import './util/polyfills'
import BackgroundTask from 'react-native-background-task'
import PushNotification from 'react-native-push-notification'
import {sprintf} from 'sprintf-js'
import s from './locales/strings.js'
const store: {} = configureStore({})

const perfTimers = {}
const perfCounters = {}

console.log('***********************')
console.log('App directory: ' + RNFS.DocumentDirectoryPath)
console.log('***********************')

// $FlowFixMe
global.OS = Platform.OS

if (!__DEV__) {
  // TODO: Fix logger to append data vs read/modify/write
  // $FlowFixMe: suppressing this error until we can find a workaround
  console.log = log
  // $FlowFixMe: suppressing this error until we can find a workaround
  // console.log = () => {}
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

BackgroundTask.define(async () => {
  makeCoreContext()
    .then(async (context) => {
      try {
        const result = await context.fetchLoginMessages()
        const date = new Date(Date.now() + 1000)
        // for each key
        for (const key in result) {
          // skip loop if the property is from prototype
          if (!result.hasOwnProperty(key)) continue
          const obj = result[key]
          if (obj.otpResetPending) {
            if (Platform === 'ios') {
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
        console.error(error)
      }
    })
  BackgroundTask.finish()
})

export default class App extends Component<{}> {
  componentDidMount () {
    BackgroundTask.schedule()
  }

  render () {
    return (
      <Provider store={store}>
        <Main />
      </Provider>
    )
  }
}
