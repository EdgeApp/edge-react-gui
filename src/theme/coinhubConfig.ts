import { AppConfig } from '../types/types'
import { coinhubDark } from './variables/coinhubDark'
import { coinhubLight } from './variables/coinhubLight'

export const coinhubConfig: AppConfig = {
  appId: 'app.coinhubatm.wallet',
  appName: 'Coinhub Bitcoin Wallet',
  appNameShort: 'Coinhub Bitcoin Wallet',
  appStore: 'https://itunes.apple.com/app/id1344400091',
  configName: 'coinhub',
  darkTheme: coinhubDark,
  defaultWallets: ['BTC', 'ETH', 'LTC', 'BCH', 'DASH'],
  knowledgeBase: 'https://coinhubatm.app/faqs/',
  lightTheme: coinhubLight,
  notificationServers: ['https://notif1.edge.app'],
  phoneNumber: '+1-702-530-1530',
  referralServers: [],
  supportsEdgeLogin: false,
  supportEmail: 'support@coinhubatm.app',
  supportSite: 'https://coinhubatm.app/contactus',
  termsOfServiceSite: 'https://coinhubatm.app/tcs/',
  website: 'https://coinhubatm.app',
  extraTab: {
    webviewUrl: 'https://coinhubatm.app/locations',
    tabTitleKey: 'title_map',
    extraTabBarIconFont: 'Feather',
    extraTabBarIconName: 'map-pin'
  }
}
