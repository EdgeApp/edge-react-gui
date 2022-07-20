// @flow

import type { AppConfig } from '../types/types.js'
import { edgeDark } from './variables/edgeDark.js'
import { edgeLight } from './variables/edgeLight.js'

export const edgeConfig: AppConfig = {
  appId: undefined,
  appName: 'Edge',
  appNameShort: 'Edge',
  appStore: 'https://itunes.apple.com/app/id1344400091',
  configName: 'edge',
  darkTheme: edgeDark,
  defaultWallets: ['BTC', 'ETH', 'LTC', 'BCH', 'DASH'],
  knowledgeBase: 'https://support.edge.app/support/home',
  lightTheme: edgeLight,
  notificationServers: ['https://notif1.edge.app'],
  phoneNumber: '+1-619-777-5688',
  referralServers: ['https://referral1.edge.app'],
  supportsEdgeLogin: true,
  supportSite: 'https://support.edge.app/support/tickets/new',
  termsOfServiceSite: 'https://edge.app/tos/',
  website: 'https://edge.app'
}
