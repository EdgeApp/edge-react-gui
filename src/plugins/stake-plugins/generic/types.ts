import { AssetId, StakeProviderInfo } from '../types'
import { StakeAdapterConfig } from './policyAdapters/types'

export interface StakePluginInfo {
  pluginId: string
  policyConfigs: Array<StakePolicyConfig<StakeAdapterConfig>>
}

export interface StakePolicyConfig<AdapterConfig> {
  stakePolicyId: string

  // Currency Scope:
  parentCurrencyCode: string
  parentPluginId: string

  // Stake info:
  stakeProviderInfo: StakeProviderInfo

  // Config options:
  adapterConfig: AdapterConfig
  hideClaimAction?: boolean
  hideUnstakeAction?: boolean
  hideUnstakeAndClaimAction?: boolean
  isStablePool?: boolean

  // Assets:
  stakeAssets: AssetId[]
  rewardAssets: AssetId[]
}
