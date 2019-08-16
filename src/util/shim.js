/* eslint-disable flowtype/require-valid-file-annotation */
/* global localStorage __DEV__ */

require('core-js')

if (typeof __dirname === 'undefined') global.__dirname = '/'
if (typeof __filename === 'undefined') global.__filename = ''
if (typeof process === 'undefined') {
  global.process = require('process')
} else {
  const bProcess = require('process')
  for (const p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p]
    }
  }
}

process.browser = false
if (typeof Buffer === 'undefined') global.Buffer = require('buffer/').Buffer

// global.location = global.location || { port: 80 }
const isDev = typeof __DEV__ === 'boolean' && __DEV__
process.env['NODE_ENV'] = isDev ? 'development' : 'production'
if (typeof localStorage !== 'undefined') {
  localStorage.debug = isDev ? '*' : ''
}

// Prevents bcoin from crashing at boot on Android:
if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj, proto) {
    obj.__proto__ = proto // eslint-disable-line
    return obj
  }
}
