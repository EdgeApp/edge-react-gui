import type { StakeAssetInfo, StakePolicy, StakeProviderInfo } from '../types'
import type { InfoServerResponse } from '../util/internalTypes'
import type { StakePluginPolicy } from './types'

export interface StakePolicyInfo {
  stakePolicyId: string
  stakeProviderInfo: StakeProviderInfo
  parentPluginId: string
  parentCurrencyCode: string
  policy: StakePluginPolicy
  isStablePool?: boolean
  poolAddress?: string
  stakeAssets: StakeAssetInfo[]
  rewardAssets: StakeAssetInfo[]
  deprecated?: boolean
  unstakeWarning?: string
}

export const toStakePolicy =
  (infoResponse: InfoServerResponse) =>
  (policyInfo: StakePolicyInfo): StakePolicy => {
    const {
      isStablePool,
      stakeProviderInfo,
      stakeAssets,
      rewardAssets,
      deprecated,
      unstakeWarning
    } = policyInfo
    const stakePolicyId = policyInfo.stakePolicyId
    const apy = infoResponse.policies[stakePolicyId]
    const yieldType =
      isStablePool != null ? (isStablePool ? 'stable' : 'variable') : undefined

    return {
      stakePolicyId,
      stakeProviderInfo,
      apy,
      hideUnstakeAction: true,
      yieldType,
      stakeAssets,
      rewardAssets,
      deprecated,
      unstakeWarning
    }
  }
