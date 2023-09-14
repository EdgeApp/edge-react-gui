import { AssetId, StakePolicy, StakeProviderInfo } from '../types'
import { InfoServerResponse } from '../util/internalTypes'
import { StakePluginPolicy } from './types'

export interface StakePolicyInfo {
  stakePolicyId: string
  stakeProviderInfo?: StakeProviderInfo
  parentPluginId: string
  parentCurrencyCode: string
  policy: StakePluginPolicy
  isStablePool?: boolean
  stakeAssets: AssetId[]
  rewardAssets: AssetId[]
}

export const toStakePolicy =
  (infoResponse: InfoServerResponse) =>
  (policyInfo: StakePolicyInfo): StakePolicy => {
    const { isStablePool, stakeProviderInfo, stakeAssets, rewardAssets } = policyInfo
    const stakePolicyId = policyInfo.stakePolicyId
    const apy = infoResponse.policies[stakePolicyId]
    const yieldType = isStablePool != null ? (isStablePool ? 'stable' : 'variable') : undefined

    return {
      stakePolicyId,
      stakeProviderInfo,
      apy,
      yieldType,
      stakeAssets,
      rewardAssets
    }
  }
