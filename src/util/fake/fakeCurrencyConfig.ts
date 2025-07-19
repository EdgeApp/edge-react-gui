import {
  EdgeCurrencyConfig,
  EdgeCurrencyInfo,
  EdgeTokenMap
} from 'edge-core-js'

export function makeFakeCurrencyConfig(
  currencyInfo: Partial<EdgeCurrencyInfo>,
  tokens: EdgeTokenMap = {}
): EdgeCurrencyConfig {
  return {
    currencyInfo: {
      pluginId: 'fake',
      displayName: 'FakeCoin',
      chainDisplayName: 'FakeChain',
      assetDisplayName: 'FakeCoin',
      walletType: 'wallet:fake',
      currencyCode: 'FAKE',
      denominations: [{ multiplier: '1000', name: 'FAKE' }],
      addressExplorer: '',
      transactionExplorer: '',
      ...currencyInfo
    },

    allTokens: tokens,
    alwaysEnabledTokenIds: [],
    builtinTokens: tokens,
    customTokens: {},
    otherMethods: {},
    userSettings: {},

    addCustomToken: async () => 'token-xyz',
    changeAlwaysEnabledTokenIds: async () => {},
    changeCustomToken: async () => {},
    changeUserSettings: async () => {},
    getTokenDetails: async () => [],
    getTokenId: async () => '',
    importKey: async () => ({}),
    removeCustomToken: async () => {},
    watch: () => () => {}
  }
}
