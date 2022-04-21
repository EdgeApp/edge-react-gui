// @flow
import { type StakePluginPolicy } from './policies/types'
import { type AssetId, type InfoServerResponse } from './types'
import type { StakePolicy } from './types.js'

export type StakePolicyInfo = {
  stakePolicyId: string,
  parentPluginId: string,
  parentTokenId: string,
  policy: StakePluginPolicy,
  swapPluginId?: string,
  stakeAssets: AssetId[],
  rewardAssets: AssetId[],
  mustClaimRewards: boolean
}

const sortAssetIds = (a: AssetId, b: AssetId): number => {
  if (a.pluginId < b.pluginId) return -1
  if (a.pluginId > b.pluginId) return 1
  if (a.tokenId < b.tokenId) return -1
  if (a.tokenId > b.tokenId) return 1
  return 0
}

// Generate a unique deterministic ID for the policy
const deriveStakePolicyId = (policyInfo: StakePolicyInfo): string => {
  const { swapPluginId = '' } = policyInfo
  const stakePart = policyInfo.stakeAssets
    .sort(sortAssetIds)
    .map(asset => `${asset.pluginId}:${asset.tokenId}`)
    .join('+')
  const rewardPart = policyInfo.rewardAssets
    .sort(sortAssetIds)
    .map(asset => `${asset.pluginId}:${asset.tokenId}`)
    .join('+')
  return `${swapPluginId}/${stakePart}=${rewardPart}`.toLowerCase()
}

export const withGeneratedStakePolicyId = (policyInfo: StakePolicyInfo): StakePolicyInfo => {
  const stakePolicyId = deriveStakePolicyId(policyInfo)
  // Include all fields except for the policy ID
  const { stakePolicyId: _exclude, ...rest } = policyInfo

  return {
    stakePolicyId,
    ...rest
  }
}

export const toStakePolicy =
  (infoResponse: InfoServerResponse) =>
  (policyInfo: StakePolicyInfo): StakePolicy => {
    const { swapPluginId, stakeAssets, rewardAssets, mustClaimRewards } = policyInfo
    const stakePolicyId = deriveStakePolicyId(policyInfo)
    const apy = infoResponse.policies[stakePolicyId]

    return {
      stakePolicyId,
      apy,
      swapPluginId,
      stakeAssets,
      rewardAssets,
      mustClaimRewards
    }
  }
