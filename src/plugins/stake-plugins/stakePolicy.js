// @flow
import { type StakePluginPolicy } from './policies/types'
import { type AssetId, type InfoServerResponse, type LiquidityPool } from './types'
import type { StakePolicy } from './types.js'

export type StakePolicyInfo = {|
  stakePolicyId: string,
  parentPluginId: string,
  parentTokenId: string,
  policy: StakePluginPolicy,
  liquidityPool?: LiquidityPool,
  stakeAssets: AssetId[],
  rewardAssets: AssetId[],
  mustClaimRewards: boolean
|}

// Generate a unique deterministic ID for the policy
const deriveStakePolicyId = (policyInfo: StakePolicyInfo): string => {
  const { liquidityPool } = policyInfo
  const liquidityPoolPart = liquidityPool ? `${liquidityPool.pluginId}:${liquidityPool.lpId}/` : ''
  const stakePart = policyInfo.stakeAssets.map(asset => `${asset.pluginId}:${asset.tokenId}`).join('+')
  const rewardPart = policyInfo.rewardAssets.map(asset => `${asset.pluginId}:${asset.tokenId}`).join('+')
  return `${liquidityPoolPart}${stakePart}=${rewardPart}`.toLowerCase()
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
    const { liquidityPool, stakeAssets, rewardAssets, mustClaimRewards } = policyInfo
    const stakePolicyId = deriveStakePolicyId(policyInfo)
    const apy = infoResponse.policies[stakePolicyId]

    return {
      stakePolicyId,
      apy,
      liquidityPool,
      stakeAssets,
      rewardAssets,
      mustClaimRewards
    }
  }
