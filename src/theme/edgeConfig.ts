import { AppConfig } from '../types/types'
import { edgeDark } from './variables/edgeDark'
import { edgeLight } from './variables/edgeLight'

export const edgeConfig: AppConfig = {
  appId: undefined,
  appName: 'Edge',
  appNameShort: 'Edge',
  appStore: 'https://itunes.apple.com/app/id1344400091',
  backupAccountSite: 'https://edge.app/light-account-creation/',
  configName: 'edge',
  darkTheme: edgeDark,
  defaultWallets: [
    { pluginId: 'bitcoin', tokenId: null },
    { pluginId: 'ethereum', tokenId: null },
    { pluginId: 'litecoin', tokenId: null },
    { pluginId: 'bitcoincash', tokenId: null },
    { pluginId: 'dash', tokenId: null }
  ],
  forceCloseUrl: 'https://support.edge.app/hc/en-us/articles/26702768694811-How-to-force-close-Edge-Android-and-iOS',
  ip2faSite: 'https://support.edge.app/hc/en-us/articles/7018106439579-Edge-Security-IP-Validation-and-2FA',
  knowledgeBase: 'https://help.edge.app/support/home',
  lightTheme: edgeLight,
  notificationServers: ['https://push2.edge.app'],
  phoneNumber: '+1-619-777-5688',
  referralServers: ['https://referral1.edge.app'],
  supportsEdgeLogin: true,
  supportEmail: 'support@edge.app',
  supportContactSite: 'https://support.edge.app/hc/en-us/requests/new',
  supportSite: 'https://help.edge.app/support/tickets/new',
  termsOfServiceSite: 'https://edge.app/tos/',
  website: 'https://edge.app'
}
