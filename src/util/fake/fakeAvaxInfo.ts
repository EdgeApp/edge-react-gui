import { EdgeCurrencyInfo } from 'edge-core-js'

import { FakeSettings } from './fakeCurrencyPlugin'

const defaultSettings: FakeSettings = {
  customFeeSettings: ['gasLimit', 'gasPrice'],
  publicAddress: '0x0d73358506663d484945ba85d0cd435ad610b0a0',
  networkFee: '100000000000000',
  parentNetworkFee: '1000000000000000',
  balances: {
    AVAX: '10.234', // balances in exchange amount
    JOE: '10000'
  }
}

export const avaxCurrencyInfo: EdgeCurrencyInfo = {
  // Basic currency information:
  currencyCode: 'AVAX',
  displayName: 'Avalanche',
  pluginId: 'avalanche',
  walletType: 'wallet:avalanche',
  memoType: 'hex',

  canReplaceByFee: true,
  defaultSettings,

  addressExplorer: 'https://snowtrace.io/address/%s',
  transactionExplorer: 'https://snowtrace.io/tx/%s',

  denominations: [
    // An array of Objects of the possible denominations for this currency
    {
      name: 'AVAX',
      multiplier: '1000000000000000000',
      symbol: 'AVAX'
    }
  ],
  metaTokens: [
    {
      currencyCode: 'PNG',
      currencyName: 'Pangolin',
      denominations: [
        {
          name: 'PNG',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0x60781C2586D68229fde47564546784ab3fACA982'
    },
    {
      currencyCode: 'PEFI',
      currencyName: 'Penguin Finance',
      denominations: [
        {
          name: 'PEFI',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0xe896CDeaAC9615145c0cA09C8Cd5C25bced6384c'
    },
    {
      currencyCode: 'XAVA',
      currencyName: 'Avalaunch',
      denominations: [
        {
          name: 'XAVA',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0xd1c3f94DE7e5B45fa4eDBBA472491a9f4B166FC4'
    },
    {
      currencyCode: 'BIFI',
      currencyName: 'Beefy Finance',
      denominations: [
        {
          name: 'BIFI',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0xd6070ae98b8069de6B494332d1A1a81B6179D960'
    },
    {
      currencyCode: 'BNB',
      currencyName: 'Binance',
      denominations: [
        {
          name: 'BNB',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0x264c1383EA520f73dd837F915ef3a732e204a493'
    },
    {
      currencyCode: 'YAK',
      currencyName: 'Yield Yak',
      denominations: [
        {
          name: 'YAK',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0x59414b3089ce2AF0010e7523Dea7E2b35d776ec7'
    },
    {
      currencyCode: 'JOE',
      currencyName: 'Joe Token',
      denominations: [
        {
          name: 'JOE',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd'
    },
    {
      currencyCode: 'FXS',
      currencyName: 'Frax Share',
      denominations: [
        {
          name: 'FXS',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0x214DB107654fF987AD859F34125307783fC8e387'
    },
    {
      currencyCode: 'BUSD.e',
      currencyName: 'Binance USD',
      denominations: [
        {
          name: 'BUSD.e',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0x19860CCB0A68fd4213aB9D8266F7bBf05A8dDe98'
    },
    {
      currencyCode: 'DAI.e',
      currencyName: 'Dai Stablecoin',
      denominations: [
        {
          name: 'DAI.e',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70'
    },
    {
      currencyCode: 'LINK.e',
      currencyName: 'ChainLink Token',
      denominations: [
        {
          name: 'LINK.e',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0x5947BB275c521040051D82396192181b413227A3'
    },
    {
      currencyCode: 'UNI.e',
      currencyName: 'Uniswap',
      denominations: [
        {
          name: 'UNI.e',
          multiplier: '1000000000000000000'
        }
      ],
      contractAddress: '0x8eBAf22B6F053dFFeaf46f4Dd9eFA95D89ba8580'
    },
    {
      currencyCode: 'USDC.e',
      currencyName: 'USD Coin',
      denominations: [
        {
          name: 'USDC.e',
          multiplier: '1000000'
        }
      ],
      contractAddress: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664'
    },
    {
      currencyCode: 'USDT.e',
      currencyName: 'Tether USD',
      denominations: [
        {
          name: 'USDT.e',
          multiplier: '1000000'
        }
      ],
      contractAddress: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118'
    },
    {
      currencyCode: 'WBTC.e',
      currencyName: 'Wrapped BTC',
      denominations: [
        {
          name: 'WBTC.e',
          multiplier: '100000000'
        }
      ],
      contractAddress: '0x50b7545627a5162F82A992c33b87aDc75187B218'
    }
  ]
}
