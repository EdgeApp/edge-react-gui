import { AppConfig } from '../types/types'
import { deloreanDark } from './variables/deloreanDark'
import { edgeLight } from './variables/edgeLight'

export const deloreanConfig: AppConfig = {
  appId: undefined,
  appName: 'Delorean Wallet',
  appNameShort: 'Delorean',
  appStore: 'https://itunes.apple.com/app/id1344400091',
  configName: 'delorean',
  darkTheme: deloreanDark,
  defaultWallets: ['BTC', 'ETH', 'LTC', 'BCH', 'DASH'],
  knowledgeBase: 'https://support.edge.app/support/home',
  lightTheme: edgeLight,
  notificationServers: ['https://notif1.edge.app'],
  phoneNumber: '+1-619-777-5688',
  referralServers: ['https://referral1.edge.app'],
  supportsEdgeLogin: true,
  supportEmail: 'support@edge.app',
  supportSite: 'https://support.edge.app/support/tickets/new',
  termsOfServiceSite: 'https://edge.app/tos/',
  website: 'https://edge.app'
}
