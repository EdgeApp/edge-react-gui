// @flow
import type { StakePolicy } from './types.js'

export type StakePolicyInfo = {
  stakePolicyId: string,
  parentTokenId: string,
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

export const toStakePolicy = (policyInfo: StakePolicyInfo): StakePolicy => {
  const { stakeAssets, rewardAssets, mustClaimRewards } = policyInfo

  const stakePart = stakeAssets.map(asset => `${asset.pluginId}:${asset.tokenId}`).join('+')
  const rewardPart = rewardAssets.map(asset => `${asset.pluginId}:${asset.tokenId}`).join('+')
  const stakePolicyId = `${stakePart}=${rewardPart}`

  const stakeAssetMap: { [pluginId: string]: { [tokenId: string]: boolean } } = stakeAssets.reduce(
    (map, asset) => ({ ...map, [asset.pluginId]: { [asset.tokenId]: true } }),
    {}
  )
  const rewardAssetMap: { [pluginId: string]: { [tokenId: string]: boolean } } = rewardAssets.reduce(
    (map, asset) => ({ ...map, [asset.pluginId]: { [asset.tokenId]: true } }),
    {}
  )
  // TODO: Calculate the APY or use a parameter from the current function
  const apy = 100

  return {
    stakePolicyId,
    apy,
    stakeAssets: stakeAssetMap,
    rewardAssets: rewardAssetMap,
    mustClaimRewards
  }
}
