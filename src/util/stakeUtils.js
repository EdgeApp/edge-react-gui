// @flow
import { type EdgeCurrencyWallet } from 'edge-core-js'

import { type StakePlugin, type StakePolicy } from '../plugins/stake-plugins/types.js'

export const getStakeDetails = async (stakePlugin: StakePlugin, stakePolicyId: string, currencyWallet: EdgeCurrencyWallet) => {
  return stakePlugin.fetchStakeDetails({ stakePolicyId, wallet: currencyWallet })
}

// TODO: (V2) Hard-coded for single asset
export const getRewardAllocation = async (stakePlugin: StakePlugin, stakePolicyId: string, currencyWallet: EdgeCurrencyWallet) => {
  const stakeDetails = await getStakeDetails(stakePlugin, stakePolicyId, currencyWallet)
  return stakeDetails?.allocations.filter(stakeDetail => stakeDetail.allocationType === 'earned')[0]
}

// TODO: (V2) Hard-coded for single asset
export const getStakeAllocation = async (stakePlugin: StakePlugin, stakePolicyId: string, currencyWallet: EdgeCurrencyWallet) => {
  const stakeDetails = await getStakeDetails(stakePlugin, stakePolicyId, currencyWallet)
  return stakeDetails?.allocations.filter(stakeDetail => stakeDetail.allocationType === 'staked')[0]
}

// Not needed?
export const getRewardDetails = async (stakePlugin: StakePlugin, stakePolicyId: string, currencyWallet: EdgeCurrencyWallet) => {
  return stakePlugin.fetchStakeDetails({ stakePolicyId, wallet: currencyWallet })
}

export const getStakePolicyById = async (stakePlugin: StakePlugin, stakePolicyId: string): Promise<StakePolicy | void> => {
  return await stakePlugin.getStakePolicies().then(stakePolicies => stakePolicies.find(policy => policy.stakePolicyId === stakePolicyId))
}

export const getStakeAssetsName = (stakePolicy: StakePolicy) => {
  const stakeChainsArr = Object.keys(stakePolicy.stakeAssets)
  const stakeTokensArr = stakeChainsArr.map(chain => Object.keys(stakePolicy.stakeAssets[chain]))[0]
  const stakeAssetsName = stakeTokensArr.length > 1 ? `${stakeTokensArr.join('-')}-LP` : stakeTokensArr[0]
  return stakeAssetsName
}

export const getRewardAssetsName = (stakePolicy: StakePolicy) => {
  const rewardChainsArr = Object.keys(stakePolicy.rewardAssets)
  const rewardTokensArr = rewardChainsArr.map(chain => Object.keys(stakePolicy.rewardAssets[chain]))[0]
  const rewardAssetsName = rewardTokensArr.length > 1 ? `${rewardTokensArr.join(', ')}` : rewardTokensArr[0]
  return rewardAssetsName
}
