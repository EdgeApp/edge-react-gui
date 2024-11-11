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
  defaultWallets: [
    { pluginId: 'bitcoin', tokenId: null },
    { pluginId: 'fantom', tokenId: '6c021ae822bea943b2e66552bde1d2696a53fbb7' },
    { pluginId: 'ethereum', tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' }
  ],
  forceCloseUrl: 'https://support.edge.app/hc/en-us/articles/26702768694811-How-to-force-close-Edge-Android-and-iOS',
  ip2faSite: 'https://support.edge.app/hc/en-us/articles/7018106439579-Edge-Security-IP-Validation-and-2FA',
  knowledgeBase: 'https://support.testy.com/knowledge',
  lightTheme: testLight,
  notificationServers: ['https://push2.edge.app'],
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
