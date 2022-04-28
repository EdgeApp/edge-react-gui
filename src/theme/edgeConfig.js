// @flow

import type { AppConfig } from '../types/types.js'
import { edgeDark } from './variables/edgeDark.js'
import { edgeLight } from './variables/edgeLight.js'

export const edgeConfig: AppConfig = {
  configName: 'edge',
  appName: 'Edge',
  appNameShort: 'Edge',
  darkTheme: edgeDark,
  lightTheme: edgeLight,
  supportsEdgeLogin: true,
  referralServers: ['https://referral1.edge.app'],
  notificationServers: ['https://notif1.edge.app'],
  knowledgeBase: 'https://support.edge.app/support/home',
  supportSite: 'https://support.edge.app/support/tickets/new',
  phoneNumber: '+1-855-346-4974',
  website: 'https://edge.app',
  termsOfServiceSite: 'https://edge.app/tos/',
  appStore: 'https://itunes.apple.com/app/id1344400091',
  defaultWallets: ['BTC', 'BCH', 'ETH']
}
