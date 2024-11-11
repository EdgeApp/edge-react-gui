import { StakeAssetInfo, StakeProviderInfo } from '../types'
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
  disableMaxStake?: boolean
  hideClaimAction?: boolean
  hideUnstakeAction?: boolean
  hideUnstakeAndClaimAction?: boolean
  isStablePool?: boolean
  isLiquidStaking?: boolean
  mustMaxUnstake?: boolean
  deprecated?: boolean
  claimWarning?: string | null
  stakeWarning?: string | null
  unstakeWarning?: string | null

  // Assets:
  stakeAssets: StakeAssetInfo[]
  rewardAssets: StakeAssetInfo[]
}
