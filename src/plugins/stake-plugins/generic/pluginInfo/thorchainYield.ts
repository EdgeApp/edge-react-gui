import { ENV } from '../../../../env'
import type { ThorchainYieldAdapterConfig } from '../policyAdapters/ThorchainYieldAdaptor'
import type { StakePluginInfo, StakePolicyConfig } from '../types'

const thorchainYieldPolicyConfig: Array<
  StakePolicyConfig<ThorchainYieldAdapterConfig>
> = [
  {
    stakePolicyId: 'thorchain_yield',
    stakeProviderInfo: {
      displayName: 'Thorchain Yield',
      pluginId: 'thorchainrune',
      stakeProviderId: 'thorchain_yield'
    },
    parentPluginId: 'thorchainrune',
    parentCurrencyCode: 'RUNE',
    adapterConfig: {
      type: 'thorchain-yield',
      pluginId: 'thorchainrune',
      ninerealmsClientId:
        ENV.THORCHAIN_INIT !== false
          ? ENV.THORCHAIN_INIT.ninerealmsClientId
          : undefined,
      thornodeServers: ['https://thornode.ninerealms.com']
    },

    hideClaimAction: true,
    hideUnstakeAndClaimAction: true,
    stakeAssets: [
      { pluginId: 'thorchainrune', tokenId: 'tcy', currencyCode: 'TCY' }
    ],
    rewardAssets: [
      { pluginId: 'thorchainrune', tokenId: null, currencyCode: 'RUNE' }
    ]
  }
]

export const thorchainYield: StakePluginInfo = {
  pluginId: 'stake:thorchain:yield',
  policyConfigs: [...thorchainYieldPolicyConfig]
}
