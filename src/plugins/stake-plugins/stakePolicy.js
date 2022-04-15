// @flow
import { type StakePluginPolicy } from './policies/types'
import { type InfoServerResponse } from './types'
import type { StakePolicy } from './types.js'

export type StakePolicyInfo = {
  stakePolicyId: string,
  parentPluginId: string,
  parentTokenId: string,
  policy: StakePluginPolicy,
  stakeAssets: Array<{
    pluginId: string,
    tokenId: string
  }>,
  rewardAssets: Array<{
    pluginId: string,
    tokenId: string
  }>,
  mustClaimRewards: boolean
}

export const withGeneratedStakePolicyId = (policyInfo: StakePolicyInfo): StakePolicyInfo => {
  // Generate a unique deterministic ID for the policy
  const stakePart = policyInfo.stakeAssets.map(asset => `${asset.pluginId}:${asset.tokenId}`).join('+')
  const rewardPart = policyInfo.rewardAssets.map(asset => `${asset.pluginId}:${asset.tokenId}`).join('+')
  const stakePolicyId = `${stakePart}=${rewardPart}`
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
    const stakePart = stakeAssets.map(asset => `${asset.pluginId}:${asset.tokenId}`).join('+')
    const rewardPart = rewardAssets.map(asset => `${asset.pluginId}:${asset.tokenId}`).join('+')
    const stakePolicyId = `${stakePart}=${rewardPart}`

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
