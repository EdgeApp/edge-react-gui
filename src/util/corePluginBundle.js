// WebPack bundles this thing up to give us our core plugins.

import 'core-js'
import 'edge-currency-monero'
import 'edge-exchange-plugins'

import { setMemletConfig } from 'edge-currency-plugins'

setMemletConfig({
  maxMemoryUsage: 50 * 1024 * 1024 // 50MB
})
