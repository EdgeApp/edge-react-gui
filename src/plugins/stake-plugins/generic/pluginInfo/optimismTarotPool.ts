import { lstrings } from '../../../../locales/strings'
import { StakeProviderInfo } from '../../types'
import { TarotPoolAdapterConfig } from '../policyAdapters/TarotPoolAdaptor'
import { StakePluginInfo, StakePolicyConfig } from '../types'

const stakeProviderInfo: StakeProviderInfo = {
  displayName: 'Tarot Finance',
  pluginId: 'optimism',
  stakeProviderId: 'optimism_tarot'
}

const commonAdaptorConfig = {
  type: 'tarot-velodrome-pool' as const,
  rpcProviderUrls: [`https://rpc.ankr.com/optimism`],
  velodromeRouterContractAddress: '0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858',
  tarotRouterContractAddress: '0x9761d46Ef36E07131E8c56af06e35CaC23b9A91E',
  leverage: 5
}

const adaptors: TarotPoolAdapterConfig[] = [
  {
    ...commonAdaptorConfig,
    poolContractAddress: '0x3b749bE6cA33f27E2837138EDE69F8c6C53f9207',
    token0: {
      contractAddress: '0x1F514A61bcde34F94Bc39731235690ab9da737F7',
      symbol: 'TAROT',
      decimals: 18,
      tokenId: '1f514a61bcde34f94bc39731235690ab9da737f7'
    },
    token1: {
      contractAddress: '0x4200000000000000000000000000000000000042',
      symbol: 'OP',
      decimals: 18,
      tokenId: '4200000000000000000000000000000000000042'
    },
    lpToken: {
      contractAddress: '0xF2D42c46528116362Aca448837A0236459B53C63',
      symbol: 'vAMMV2-TAROT/OP'
    },
    collateralContractAddress: '0xAC181c3c33220f12F619dC4F5FA82937C8183d53',
    token0BorrowableContractAddress: '0x3bF5E17A8242D5f96e8CB3136750f135F8e889Dd',
    token1BorrowableContractAddress: '0xfAcDD4a72b110Be8F193Ebdb0ba66196955D919E',
    velodromeFactoryContractAddress: '0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a',
    isStable: false,
    isTarotVault: true
  },
  {
    ...commonAdaptorConfig,
    poolContractAddress: '0x80942A0066F72eFfF5900CF80C235dd32549b75d',
    token0: {
      contractAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      symbol: 'USDC',
      decimals: 6,
      tokenId: '0b2c639c533813f4aa9d7837caf62653d097ff85'
    },
    token1: {
      contractAddress: '0x1F514A61bcde34F94Bc39731235690ab9da737F7',
      symbol: 'TAROT',
      decimals: 18,
      tokenId: '1f514a61bcde34f94bc39731235690ab9da737f7'
    },
    lpToken: {
      contractAddress: '0x707ba27189e8Bf89e43b2198E6b88AAC4720124f',
      symbol: 'vAMMV2-USDC/TAROT'
    },
    collateralContractAddress: '0xcCb52c8c9eFB06b9D5534127Ba5362F4d8E9c0Fe',
    token0BorrowableContractAddress: '0x388a16D05b5eB4BB4c6D6f841544c6138219dF53',
    token1BorrowableContractAddress: '0x319193ff130285329Cc5fD4a46694f969d23A275',
    velodromeFactoryContractAddress: '0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a',
    isStable: false,
    isTarotVault: true
  },
  {
    ...commonAdaptorConfig,
    poolContractAddress: '0x3CD9F7912B6b04b702232FBb3f12F94145B8A0E4',
    token0: {
      contractAddress: '0x1F514A61bcde34F94Bc39731235690ab9da737F7',
      symbol: 'TAROT',
      decimals: 18,
      tokenId: '1f514a61bcde34f94bc39731235690ab9da737f7'
    },
    token1: {
      contractAddress: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      symbol: 'USDC',
      decimals: 6,
      tokenId: '7f5c764cbc14f9669b88837ca1490cca17c31607'
    },
    lpToken: {
      contractAddress: '0x2E931De1fcB2681Dc98601e0b513308DA9C5cEae',
      symbol: 'vAMMV2-TAROT/USDC'
    },
    collateralContractAddress: '0x8900CB225992E99749AF222095A75C22343bede1',
    token0BorrowableContractAddress: '0xA76ab78453164dA65923FFcbe6Fa3C171C219459',
    token1BorrowableContractAddress: '0xB6e8C7d12DF9e2d6784f661B63466C4d77f57A2E',
    velodromeFactoryContractAddress: '0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a',
    isStable: false,
    isTarotVault: true
  },
  {
    ...commonAdaptorConfig,
    poolContractAddress: '0x5B0dce514B4AEd993751D2CF7379B75df9860312',
    token0: {
      contractAddress: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      symbol: 'USDC',
      decimals: 6,
      tokenId: '7f5c764cbc14f9669b88837ca1490cca17c31607'
    },
    token1: {
      contractAddress: '0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db',
      symbol: 'VELO',
      decimals: 18,
      tokenId: '9560e827af36c94d2ac33a39bce1fe78631088db'
    },
    lpToken: {
      contractAddress: '0x8134A2fDC127549480865fB8E5A9E8A8a95a54c5',
      symbol: 'vAMMV2-USDC/VELO'
    },
    collateralContractAddress: '0x554197E3593C2262A8AD0BfB22835f28f4BC384D',
    token0BorrowableContractAddress: '0xb842242c26747F46EBA2528De19Ff12FAf576191',
    token1BorrowableContractAddress: '0x68Ef7f9b5dEBce90F654DC988E17c504782EC76D',
    velodromeFactoryContractAddress: '0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a',
    isStable: false,
    isTarotVault: true
  },
  {
    ...commonAdaptorConfig,
    poolContractAddress: '0xd9bfA638e33e59DbDDCF667dE1813B6E9aF50346',
    token0: {
      contractAddress: '0x4200000000000000000000000000000000000042',
      symbol: 'OP',
      decimals: 18,
      tokenId: '4200000000000000000000000000000000000042'
    },
    token1: {
      contractAddress: '0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db',
      symbol: 'VELO',
      decimals: 18,
      tokenId: '9560e827af36c94d2ac33a39bce1fe78631088db'
    },
    lpToken: {
      contractAddress: '0xe9581d0F1A628B038fC8B2a7F5A7d904f0e2f937',
      symbol: 'vAMMV2-OP/VELO'
    },
    collateralContractAddress: '0xEC21A442E1458137D6d3f9aE94F8BD82137b69c5',
    token0BorrowableContractAddress: '0x85861B726006ec8e2a276781741F25FB813BEea4',
    token1BorrowableContractAddress: '0xB9D9dE899425555355Fdb0d3c70901E74b090115',
    velodromeFactoryContractAddress: '0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a',
    isStable: false,
    isTarotVault: true
  }
]

const makePolicyConfig = (adapterConfig: TarotPoolAdapterConfig) => {
  return {
    stakePolicyId: `optimism_tarot_${adapterConfig.token0.tokenId}_${adapterConfig.token1.tokenId}_${adapterConfig.leverage}x`,
    stakeProviderInfo: { ...stakeProviderInfo, displayName: `Tarot Finance ${adapterConfig.leverage}x Leverage` },
    parentPluginId: 'optimism',
    parentCurrencyCode: 'ETH',
    stakeWarning: lstrings.stake_warning_multiple_transactions,
    hideClaimAction: true,
    hideUnstakeAndClaimAction: true,
    mustMaxUnstake: true,
    adapterConfig,
    stakeAssets: [
      { pluginId: 'optimism', currencyCode: adapterConfig.token0.symbol },
      { pluginId: 'optimism', currencyCode: adapterConfig.token1.symbol }
    ],
    rewardAssets: [
      { pluginId: 'optimism', currencyCode: adapterConfig.token0.symbol },
      { pluginId: 'optimism', currencyCode: adapterConfig.token1.symbol }
    ]
  }
}

const optimismPolicyConfig: Array<StakePolicyConfig<TarotPoolAdapterConfig>> = adaptors.map(adaptor => makePolicyConfig(adaptor))

export const tarotpool: StakePluginInfo = {
  pluginId: 'stake:optimism:tarot',
  policyConfigs: [...optimismPolicyConfig]
}
