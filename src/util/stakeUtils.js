// @flow
import { type EdgeCurrencyWallet } from 'edge-core-js'

import { type AllocationType, type DetailAllocation } from '../plugins/stake-plugins/types'
import type { StakeDetails, StakePlugin, StakePolicy } from '../plugins/stake-plugins/types.js'
import { getCurrencyIcon } from './CurrencyInfoHelpers.js'

export const getStakeDetails = async (stakePlugin: StakePlugin, stakePolicyId: string, currencyWallet: EdgeCurrencyWallet) => {
  return stakePlugin.fetchStakeDetails({ stakePolicyId, wallet: currencyWallet })
}

// TODO: Use getAllocations?
export const getRewardAllocation = async (stakeDetails: StakeDetails) => {
  const rewardAllocations = stakeDetails.allocations.filter(stakeDetail => stakeDetail.allocationType === 'earned')
  return rewardAllocations.length > 0 ? rewardAllocations[0] : null
}

// TODO: Use getAllocations?
export const getStakeAllocation = async (stakeDetails: StakeDetails) => {
  return stakeDetails.allocations.filter(stakeDetail => stakeDetail.allocationType === 'staked')[0]
}

export const getAllocations = async (stakeDetails: StakeDetails, allocationType: AllocationType): Promise<DetailAllocation[]> => {
  return stakeDetails.allocations.filter(stakeDetail => stakeDetail.allocationType === allocationType)
}

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

export const getAllocationIconUris = (currencyWallet: EdgeCurrencyWallet, allocations: DetailAllocation[]): string[] => {
  const metaTokens = currencyWallet.currencyInfo.metaTokens
  const walletPluginId = currencyWallet.currencyInfo.pluginId

  return allocations.map(allocation => {
    const contractAddress = metaTokens.find(token => token.currencyCode === allocation.tokenId)?.contractAddress
    const currencyIcon = getCurrencyIcon(walletPluginId, contractAddress).symbolImage
    return currencyIcon
  })
}
