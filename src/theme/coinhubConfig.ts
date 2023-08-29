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
  defaultWallets: ['BTC', 'ETH', 'LTC', 'BCH', 'DASH'],
  knowledgeBase: 'https://coinhubbitcoinwallet.app/faqs',
  lightTheme: coinhubLight,
  notificationServers: ['https://notif1.edge.app'],
  phoneNumber: '+1-702-720-3947',
  referralServers: [],
  supportsEdgeLogin: false,
  supportEmail: 'support@coinhubatm.app',
  supportSite: 'https://coinhubbitcoinwallet.app/support',
  termsOfServiceSite: 'https://coinhubbitcoinwallet.app/terms',
  website: 'https://coinhubatm.app',
  disableSwaps: true,
  extraTab: {
    webviewUrl: 'https://coinhubbitcoinwallet.app',
    tabTitleKey: 'title_map',
    tabType: 'edgeProvider',
    extraTabBarIconFont: 'Feather',
    extraTabBarIconName: 'map-pin'
  }
}
