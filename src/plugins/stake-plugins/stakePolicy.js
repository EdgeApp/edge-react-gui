// @flow
import { type StakePluginPolicy } from './policies/types'
import { type AssetId, type InfoServerResponse } from './types'
import type { StakePolicy } from './types.js'

export type StakePolicyInfo = {
  stakePolicyId: string,
  parentPluginId: string,
  parentTokenId: string,
  policy: StakePluginPolicy,
  stakeAssets: AssetId[],
  rewardAssets: AssetId[],
  mustClaimRewards: boolean
}

// Generate a unique deterministic ID for the policy
const deriveStakePolicyId = (policyInfo: StakePolicyInfo): string => {
  const stakePart = policyInfo.stakeAssets.map(asset => `${asset.pluginId}:${asset.tokenId}`).join('+')
  const rewardPart = policyInfo.rewardAssets.map(asset => `${asset.pluginId}:${asset.tokenId}`).join('+')
  return `${stakePart}=${rewardPart}`.toLowerCase()
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
  (infoResponse: InfoServerResponse | void) =>
  (policyInfo: StakePolicyInfo): StakePolicy => {
    const { stakeAssets, rewardAssets, mustClaimRewards } = policyInfo
    const stakePolicyId = deriveStakePolicyId(policyInfo)

    let apy = 0
    if (Object.keys(infoResponse?.policies ?? {}).includes(stakePolicyId.toLowerCase())) {
      apy = infoResponse?.policies[stakePolicyId.toLowerCase()] ?? 0
    }

    return {
      stakePolicyId,
      apy,
      stakeAssets,
      rewardAssets,
      mustClaimRewards
    }
  }
