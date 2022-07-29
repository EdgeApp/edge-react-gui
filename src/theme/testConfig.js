// @flow

import type { AppConfig } from '../types/types.js'
import { testDark } from './variables/testDark.js'
import { testLight } from './variables/testLight.js'

export const testConfig: AppConfig = {
  appId: 'com.testy.wallet',
  appName: 'Testy Wallet',
  appNameShort: 'Testy',
  appStore: 'https://itunes.apple.com/app/id1344400092',
  configName: 'test',
  darkTheme: testDark,
  defaultWallets: ['BTC', 'FTM:TOMB', 'ETH:USDC'],
  knowledgeBase: 'https://support.testy.com/knowledge',
  lightTheme: testLight,
  notificationServers: ['https://notif1.edge.app'],
  phoneNumber: '+1-800-100-1000',
  referralServers: ['https://referral1.testy.com'],
  supportsEdgeLogin: false,
  supportEmail: 'support@testy.com',
  supportSite: 'https://support.testy.com',
  termsOfServiceSite: 'https://testy.com/tos/',
  website: 'https://testy.com',
  extraTab: {
    tabTitleKey: 'title_map',
    webviewUrl: 'https://amazon.com/'
  }
}
