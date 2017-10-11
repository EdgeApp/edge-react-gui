// @flow
/* global __DEV__ */
import React, {Component} from 'react'
import {Provider} from 'react-redux'
import configureStore from './lib/configureStore'
import Main from './modules/MainConnector'
import {log} from './util/logger'
import './util/polyfills'

const store: {} = configureStore({})

const perfTimers = {}
const perfCounters = {}

// $FlowFixMe: suppressing this error until we can find a workaround
console.pstart = function (label: string) {
// $FlowFixMe: suppressing this error until we can find a workaround
  if (typeof perfTimers[label] === 'undefined') {
    perfTimers[label] = Date.now()
  } else {
    console.log('Error: PTimer already started')
  }
}

// $FlowFixMe: suppressing this error until we can find a workaround
console.pend = function (label: string) {
// $FlowFixMe: suppressing this error until we can find a workaround
  if (typeof perfTimers[label] === 'number') {
    const elapsed = Date.now() - perfTimers[label]
    console.log('PTIMER: ' + label + ': ' + elapsed + 'ms')
    perfTimers[label] = undefined
  } else {
    console.log('Error: PTimer not started')
  }
}

// $FlowFixMe: suppressing this error until we can find a workaround
console.pcount = function (label: string) {
// $FlowFixMe: suppressing this error until we can find a workaround
  perfCounters[label] = perfCounters[label] + 1
  if (perfCounters[label] % 10 === 0) {
    console.log('PCOUNT: ' + label + ': ' + perfCounters[label])
  }
}

if (!__DEV__) {
  // $FlowFixMe: suppressing this error until we can find a workaround
  console.log = log
}

export default class App extends Component<{}> {
  render () {
    return (
      <Provider store={store}>
        <Main />
      </Provider>
    )
  }
}
