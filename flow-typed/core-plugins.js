// @flow

import type { EdgeOtherMethods } from 'edge-core-js'

declare module 'edge-currency-accountbased' {
  // Nothing here on React Native
}

declare module 'edge-currency-accountbased/lib/index.js' {
  // Nothing here on React Native
}

declare module 'edge-currency-accountbased/lib/react-native-io.js' {
  declare module.exports: () => EdgeOtherMethods
}

declare module 'edge-currency-monero' {
  declare function makeMoneroIo(): EdgeOtherMethods
}

declare module 'edge-currency-plugins' {
  declare function setMemletConfig(opts: {
    maxMemoryUsage?: number
  }): void
}

declare module 'edge-exchange-plugins' {
  // Nothing here on React Native
}
