import { AppConfig } from '../types/types'
import { coinhubDark } from './variables/coinhubDark'
import { coinhubLight } from './variables/coinhubLight'

export const coinhubConfig: AppConfig = {
  appId: 'app.coinhubatm.wallet',
  appName: 'Coinhub Bitcoin Wallet',
  appNameShort: 'Coinhub Bitcoin Wallet',
  appStore: 'https://itunes.apple.com/app/id6444903066',
  backupAccountSite: 'https://coinhubbitcoinwallet.app/light-account-creation/',
  configName: 'coinhub',
  darkTheme: coinhubDark,
  defaultWallets: [
    { pluginId: 'bitcoin', tokenId: null },
    { pluginId: 'ethereum', tokenId: null },
    { pluginId: 'litecoin', tokenId: null },
    { pluginId: 'bitcoincash', tokenId: null },
    { pluginId: 'dash', tokenId: null }
  ],
  forceCloseUrl: 'https://support.edge.app/hc/en-us/articles/26702768694811-How-to-force-close-Edge-Android-and-iOS',
  ip2faSite: 'https://support.edge.app/hc/en-us/articles/7018106439579-Edge-Security-IP-Validation-and-2FA',
  knowledgeBase: 'https://coinhubbitcoinwallet.app/faqs',
  lightTheme: coinhubLight,
  notificationServers: ['https://notif1.edge.app'],
  phoneNumber: '+1-702-720-3947',
  referralServers: [],
  supportsEdgeLogin: false,
  supportEmail: 'support@coinhubatm.app',
  supportContactSite: 'https://coinhubbitcoinwallet.app/support',
  supportSite: 'https://coinhubbitcoinwallet.app/support',
  termsOfServiceSite: 'https://coinhubbitcoinwallet.app/terms',
  website: 'https://coinhubatm.app',
  disableSwaps: true,
  disableSurveyModal: true,
  extraTab: {
    webviewUrl: 'https://coinhubbitcoinwallet.app/buy-atms',
    tabTitleKey: 'title_map',
    tabType: 'edgeProvider',
    extraTabBarIconFont: 'Feather',
    extraTabBarIconName: 'map-pin'
  }
}
