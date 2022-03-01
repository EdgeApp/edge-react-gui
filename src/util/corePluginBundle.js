// @flow
// WebPack bundles this thing up to give us our core plugins.

import 'core-js'
import 'edge-currency-accountbased/lib/index.js'
// import 'edge-currency-bitcoin/lib/react-native.js'
import 'edge-currency-monero'
import 'edge-currency-plugins'
import 'edge-exchange-plugins'

import { setMemletConfig } from 'memlet'

setMemletConfig({
  maxMemoryUsage: 50 * 1024 * 1024 // 50MB
})
