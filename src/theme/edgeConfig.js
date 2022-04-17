// @flow

import type { AppConfig } from '../types/types.js'
import { edgeDark } from './variables/edgeDark.js'
import { edgeLight } from './variables/edgeLight.js'

export const edgeConfig: AppConfig = {
  configName: 'edge',
  appName: 'Edge',
  darkTheme: edgeDark,
  lightTheme: edgeLight
}
