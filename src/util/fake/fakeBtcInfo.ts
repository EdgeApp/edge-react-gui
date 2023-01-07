import { EdgeCurrencyInfo } from 'edge-core-js'

import { FakeSettings } from './fakeCurrencyPlugin'

const defaultSettings: FakeSettings = {
  customFeeSettings: ['satPerByte'],
  publicAddress: '32HtSR38USjuD4iaTbEhD566m5DGon7tuD',
  networkFee: '400',
  parentNetworkFee: '',
  balances: {
    BTC: '1.3' // balances in exchange amount
  }
}

export const btcCurrencyInfo: EdgeCurrencyInfo = {
  pluginId: 'bitcoin',
  walletType: 'wallet:bitcoin',
  currencyCode: 'BTC',
  displayName: 'Bitcoin',
  denominations: [
    { name: 'BTC', multiplier: '100000000', symbol: '₿' },
    { name: 'mBTC', multiplier: '100000', symbol: 'm₿' },
    { name: 'bits', multiplier: '100', symbol: 'ƀ' },
    { name: 'sats', multiplier: '1', symbol: 's' }
  ],

  // Configuration options:
  defaultSettings,
  customFeeTemplate: [
    {
      type: 'nativeAmount',
      key: 'satPerByte',
      displayName: 'Satoshis Per Byte',
      displayMultiplier: '0'
    }
  ],
  metaTokens: [],

  // Explorers:
  blockExplorer: 'https://blockchair.com/bitcoin/block/%s',
  addressExplorer: 'https://blockchair.com/bitcoin/address/%s',
  transactionExplorer: 'https://blockchair.com/bitcoin/transaction/%s',

  // Images:
  symbolImage: ``,
  symbolImageDarkMono: ``
}
