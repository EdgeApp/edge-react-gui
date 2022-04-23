// @flow

import type { AppConfig } from '../types/types.js'
import { testDark } from './variables/testDark.js'
import { testLight } from './variables/testLight.js'

export const testConfig: AppConfig = {
  configName: 'test',
  appName: 'Testy Wallet',
  appNameShort: 'Testy',
  darkTheme: testDark,
  lightTheme: testLight,
  supportsEdgeLogin: false,
  referralServers: ['https://referral1.testy.com'],
  notificationServers: ['https://notif1.edge.app'],
  knowledgeBase: 'https://support.testy.com/knowledge',
  supportSite: 'https://support.testy.com',
  phoneNumber: '+1-800-100-1000',
  website: 'https://testy.com',
  termsOfServiceSite: 'https://testy.com/tos/',
  appStore: 'https://itunes.apple.com/app/id1344400092'
}
