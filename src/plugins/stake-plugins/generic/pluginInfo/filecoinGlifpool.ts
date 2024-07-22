import { StakeProviderInfo } from '../../types'
import { GlifInfinityPoolAdapterConfig } from '../policyAdapters/GlifInfinityPoolAdapter'
import { StakePluginInfo, StakePolicyConfig } from '../types'

const stakeProviderInfo: StakeProviderInfo = {
  displayName: 'GLIF (Infinity Pool)',
  pluginId: 'filecoinfevm',
  stakeProviderId: 'glif_infinity_pool'
}

const filecoinPolicyConfig: Array<StakePolicyConfig<GlifInfinityPoolAdapterConfig>> = [
  {
    stakePolicyId: 'fil_glif_infinity_pool_0',
    stakeProviderInfo: stakeProviderInfo,
    parentPluginId: 'filecoinfevm',
    parentCurrencyCode: 'FIL',
    adapterConfig: {
      type: 'glif-infinity-pool',
      rpcProviderUrls: [`https://api.node.glif.io/rpc/v0`],
      poolContractAddress: '0x43dAe5624445e7679D16a63211c5ff368681500c', // Pool 0
      simpleRampContractAddress: '0x8147AccE69d711bcED176a0b7a029Ff54800d930'
    },
    disableMaxStake: true,
    hideClaimAction: true,
    hideUnstakeAndClaimAction: true,
    stakeAssets: [{ pluginId: 'filecoinfevm', currencyCode: 'FIL' }],
    rewardAssets: [{ pluginId: 'filecoinfevm', currencyCode: 'FIL' }]
  }
]

export const glifpool: StakePluginInfo = {
  pluginId: 'stake:filecoin:glifpool',
  policyConfigs: [...filecoinPolicyConfig]
}
