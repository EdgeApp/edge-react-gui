/* eslint-disable import/no-default-export */

declare const imageRequire: number

// Make image imports work:
declare module '*.gif' {
  export default imageRequire
}
declare module '*.png' {
  export default imageRequire
}
declare module '*.jpeg' {
  export default imageRequire
}
declare module '*.jpg' {
  export default imageRequire
}

// Powered by react-native-svg-transformer:
declare module '*.svg' {
  import * as React from 'react'
  import { SvgProps } from 'react-native-svg'

  const SvgComponent: React.FunctionComponent<SvgProps>
  export default SvgComponent
}

// These modules lack type definitions:
declare module 'csv-stringify/lib/browser/sync' {
  export default function stringify(input: any[], options?: any): string
}

declare module 'react-native-battery-optimization-check' {
  export function BatteryOptEnabled(): Promise<boolean>
  export function RequestDisableOptimization(): Promise<void>
}

declare module 'edge-currency-monero/lib/react-native-io'
declare module 'react-native-smart-splash-screen'
declare module 'rn-id-blurview'
declare module 'react-native-wheel-picker-android'
