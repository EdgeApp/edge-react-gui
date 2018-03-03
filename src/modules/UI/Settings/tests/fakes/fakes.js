// @flow

// FAKE BITCOIN PLUGIN

export const fakeBitcoinPlugin = {
  pluginName: 'bitcoin',
  currencyInfo: {
    // Basic currency information:
    currencyCode: 'BTC',
    currencyName: 'Bitcoin',
    pluginName: 'bitcoin',
    denominations: [
      { name: 'BTC', multiplier: '100000000', symbol: '₿' },
      { name: 'mBTC', multiplier: '100000', symbol: 'm₿' },
      { name: 'bits', multiplier: '100', symbol: 'ƀ' }
    ],
    walletTypes: ['wallet:bitcoin', 'wallet:bitcoin-bip49', 'wallet:bitcoin-bip44'],

    // Configuration options:
    defaultSettings: {
      network: {
        type: 'bitcoin',
        magic: 0xd9b4bef9,
        keyPrefix: {
          privkey: 0x80,
          xpubkey: 0x0488b21e,
          xprivkey: 0x0488ade4,
          xpubkey58: 'xpub',
          xprivkey58: 'xprv',
          coinType: 0
        },
        addressPrefix: {
          pubkeyhash: 0x00,
          scripthash: 0x05,
          witnesspubkeyhash: 0x06,
          witnessscripthash: 0x0a,
          bech32: 'bc'
        }
      },
      customFeeSettings: ['satPerByte'],
      gapLimit: 10,
      maxFee: 1000000,
      defaultFee: 1000,
      feeUpdateInterval: 60000,
      feeInfoServer: 'https://bitcoinfees.21.co/api/v1/fees/list',
      infoServer: 'https://info1.edgesecure.co:8444/v1/electrumServers/BC1',
      simpleFeeSettings: {
        highFee: '150',
        lowFee: '20',
        standardFeeLow: '50',
        standardFeeHigh: '100',
        standardFeeLowAmount: '173200',
        standardFeeHighAmount: '8670000'
      },
      electrumServers: [
        'electrums://electrum-bc-az-eusa.airbitz.co:50002',
        'electrum://electrumx.westeurope.cloudapp.azure.com:50001'
      ]
    },
    metaTokens: [],

    // Explorers:
    blockExplorer: 'https://insight.bitpay.com/block/%s',
    addressExplorer: 'https://insight.bitpay.com/address/%s',
    transactionExplorer: 'https://insight.bitpay.com/tx/%s',

    // Images:
    symbolImage: 'data:image/png;base64,bitcoinsymbolimage=',
    symbolImageDarkMono: 'data:image/png;base64,bitcoinsymbolimagedarkmono'
  }
}

// FAKE ETHEREUM PLUGIN

const otherSettings = {
  etherscanApiServers: ['https://api.etherscan.io'],
  blockcypherApiServers: ['https://api.blockcypher.com'],
  superethServers: ['https://supereth1.edgesecure.co:8443'],
  iosAllowedTokens: { REP: true, WINGS: true }
}
const defaultSettings = {
  customFeeSettings: ['gasLimit', 'gasPrice'],
  otherSettings
}
export const fakeEthereumPlugin = {
  pluginName: 'ethereum',
  currencyInfo: {
    currencyCode: 'ETH',
    currencyName: 'Ethereum',
    pluginName: 'ethereum',
    walletTypes: ['wallet:ethereum'],

    defaultSettings,

    addressExplorer: 'https://etherscan.io/address/%s',
    transactionExplorer: 'https://etherscan.io/tx/%s',

    denominations: [
      // An array of Objects of the possible denominations for this currency
      {
        name: 'ETH',
        multiplier: '1000000000000000000',
        symbol: 'Ξ'
      },
      {
        name: 'mETH',
        multiplier: '1000000000000000',
        symbol: 'mΞ'
      }
    ],
    symbolImage:
      'data:image/png;base64,ethereumsymbolimage==', // Base64 encoded png image of the currency symbol (optional)
    symbolImageDarkMono:
      'data:image/png;base64,etheremsymbolimagedarkmono=', // Base64 encoded png image of the currency symbol (optional)
    metaTokens: [
      // Array of objects describing the supported metatokens
      {
        currencyCode: 'REP',
        currencyName: 'Augur',
        denominations: [
          {
            name: 'REP',
            multiplier: '1000000000000000000'
          }
        ],
        contractAddress: '0xE94327D07Fc17907b4DB788E5aDf2ed424adDff6',
        symbolImage:
          'data:image/png;base64,repsymbolimage=='
      },
      {
        currencyCode: 'WINGS',
        currencyName: 'Wings',
        denominations: [
          {
            name: 'WINGS',
            multiplier: '1000000000000000000'
          }
        ],
        contractAddress: '0x667088b212ce3d06a1b553a7221E1fD19000d9aF',
        symbolImage:
          'data:image/png;base64,wingssymbolimage'
      }
    ]
  }
}

export const fakeAccount = {
  id: 'my_account_id',
  type: 'account-repo',
  username: 'my_username',
  activeWalletIds: [
    'my_first_wallet_id',
    'my_second_wallet_id'
  ],
  archivedWalletIds: [
    'my_first_archived_wallet_id',
    'my_second_archived_wallet_id'
  ],
  currencyWallets: {
    'my_first_wallet_id': {
      id: 'my_first_wallet_id',
      currencyCode: 'BTC',
      currencyInfo: fakeBitcoinPlugin.currencyInfo
    },
    'my_second_wallet_id': {
      id: 'my_second_wallet_id',
      currencyCode: 'BTC',
      currencyInfo: fakeBitcoinPlugin.currencyInfo
    },
    'my_first_archived_wallet_id': {
      id: 'my_first_archived_wallet_id',
      currencyCode: 'BTC',
      currencyInfo: fakeBitcoinPlugin.currencyInfo
    },
    'my_second_archived_wallet_id': {
      id: 'my_second_archived_wallet_id',
      currencyCode: 'BTC',
      currencyInfo: fakeBitcoinPlugin.currencyInfo
    }
  },
  enabled: true,
  otpEnabled: true,
  otpKey: 'my_otp_key',
  loggedIn: true,

  keyLogin: false,
  newAccount: false,
  passwordLogin: false,
  pinLogin: true,
  recoveryLogin: false,

  recoveryKey: 'my_recovery_key'
}
