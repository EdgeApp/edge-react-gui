// @flow

import type { AppConfig } from '../types/types.js'
import { testDark } from './variables/testDark.js'
import { testLight } from './variables/testLight.js'

export const testConfig: AppConfig = {
  configName: 'test',
  appName: 'Testy',
  darkTheme: testDark,
  lightTheme: testLight
}
