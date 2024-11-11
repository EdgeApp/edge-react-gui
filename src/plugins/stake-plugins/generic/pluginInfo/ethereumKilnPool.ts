import { ENV } from '../../../../env'
import { EthereumPooledKilnAdapterConfig } from '../policyAdapters/EthereumKilnAdaptor'
import { StakePluginInfo, StakePolicyConfig } from '../types'

const kilnPolicyConfig: Array<StakePolicyConfig<EthereumPooledKilnAdapterConfig>> = [
  {
    stakePolicyId: 'holesky_kiln',
    stakeProviderInfo: {
      displayName: 'Holesky Pooled Staking (Kiln)',
      pluginId: 'holesky',
      stakeProviderId: 'holesky_pooled_kiln'
    },
    parentPluginId: 'holesky',
    parentCurrencyCode: 'ETH',
    adapterConfig: {
      exitQueueAddress: '0x8979117a69DfA7F4D4E3c7B59197ff03f4A2CeAF',
      type: 'ethereum-pooled-kiln',
      apiKey: ENV.KILN_TESTNET_API_KEY,
      baseUrl: 'https://api.testnet.kiln.fi',
      contractAddress: '0xb9b3b83daaaadd3866de311ffefec80dbcb048b1',
      pluginId: 'holesky',
      rpcProviderUrls: [`https://ethereum-holesky-rpc.publicnode.com`, 'https://1rpc.io/holesky']
    },
    hideUnstakeAndClaimAction: true,
    stakeAssets: [{ pluginId: 'holesky', currencyCode: 'ETH' }],
    rewardAssets: [{ pluginId: 'holesky', currencyCode: 'ETH' }]
  },
  {
    stakePolicyId: 'ethereum_kiln',
    stakeProviderInfo: {
      displayName: 'Ethereum Pooled Staking (Kiln)',
      pluginId: 'ethereum',
      stakeProviderId: 'ethereum_pooled_kiln'
    },
    parentPluginId: 'ethereum',
    parentCurrencyCode: 'ETH',
    adapterConfig: {
      exitQueueAddress: '0x8d6Fd650500f82c7D978a440348e5a9b886943bF',
      type: 'ethereum-pooled-kiln',
      apiKey: ENV.KILN_MAINNET_API_KEY,
      baseUrl: 'https://api.kiln.fi',
      contractAddress: '0xEb4d67DBa18b3bE04484dFC7B7c2780E8D32A79d',
      pluginId: 'ethereum',
      rpcProviderUrls: [`https://ethereum-rpc.publicnode.com`, 'https://1rpc.io/eth']
    },
    hideUnstakeAndClaimAction: true,
    stakeAssets: [{ pluginId: 'ethereum', currencyCode: 'ETH' }],
    rewardAssets: [{ pluginId: 'ethereum', currencyCode: 'ETH' }]
  }
]

export const kilnpool: StakePluginInfo = {
  pluginId: 'stake:ethereum:kiln',
  policyConfigs: [...kilnPolicyConfig]
}
