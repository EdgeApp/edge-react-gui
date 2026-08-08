import { ENV } from '../../../../env'
import type { ThorchainYieldAdapterConfig } from '../policyAdapters/ThorchainYieldAdaptor'
import type { StakePluginInfo, StakePolicyConfig } from '../types'

/**
 * Read as a getter, not a value. This module is evaluated during the initial
 * bundle load, which is strictly before the keys store finishes resolving
 * remote secrets into `ENV`, so an eager read would pin the baked-in fallback.
 */
const getNinerealmsClientId = (): string | undefined => {
  const thorchain = ENV.swapPlugins.thorchain
  if (typeof thorchain !== 'object' || thorchain == null) return undefined
  return (thorchain as { ninerealmsClientId?: string }).ninerealmsClientId
}

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
      get ninerealmsClientId() {
        return getNinerealmsClientId()
      },
      thornodeServers: ['https://gateway.liquify.com/chain/thorchain_api']
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
