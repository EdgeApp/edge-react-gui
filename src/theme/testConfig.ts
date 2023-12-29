import { AppConfig } from '../types/types'
import { testDark } from './variables/testDark'
import { testLight } from './variables/testLight'

export const testConfig: AppConfig = {
  appId: 'com.testy.wallet',
  appName: 'Testy Wallet',
  appNameShort: 'Testy',
  appStore: 'https://itunes.apple.com/app/id1344400092',
  backupAccountSite: 'https://support.testy.com/accountbackupinfo',
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
  supportContactSite: 'https://support.testy.com',
  supportSite: 'https://support.testy.com',
  termsOfServiceSite: 'https://testy.com/tos/',
  website: 'https://testy.com',
  extraTab: {
    tabTitleKey: 'title_map',
    tabType: 'edgeProvider',
    webviewUrl: 'https://amazon.com/',
    extraTabBarIconFont: 'Feather',
    extraTabBarIconName: 'map-pin'
  }
}
