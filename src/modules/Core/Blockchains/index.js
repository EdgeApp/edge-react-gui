import {Platform} from 'react-native'

export const supportedWalletTypes = Platform.select({
  'ios': [
    // 'wallet:bitcoin',
    'wallet:ethereum'
  ],
  'android': [
    'wallet:ethereum'
  ]
})

export const supportedBlockchains = Platform.select({
  'ios': [
    // 'Bitcoin',
    'Ethereum'
  ],
  'android': [
    'Ethereum'
  ]
})
