// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { formatTimeDate } from '../locales/intl'
import s from '../locales/strings'
import type { DetailAllocation, StakeDetails, StakePlugin, StakePolicy } from '../plugins/stake-plugins'
import { getCurrencyIconById } from './CurrencyInfoHelpers.js'

export const getStakeDetails = async (stakePlugin: StakePlugin, stakePolicyId: string, currencyWallet: EdgeCurrencyWallet) => {
  return stakePlugin.fetchStakeDetails({ stakePolicyId, wallet: currencyWallet })
}

// TODO: Use getAllocations?
export const getRewardAllocation = async (stakeDetails: StakeDetails) => {
  return stakeDetails.allocations.filter(stakeDetail => stakeDetail.allocationType === 'earned')[0]
}

// TODO: Use getAllocations?
export const getStakeAllocation = async (stakeDetails: StakeDetails) => {
  return stakeDetails.allocations.filter(stakeDetail => stakeDetail.allocationType === 'staked')[0]
}

export const getAllocations = async (
  stakeDetails: StakeDetails,
  allocationType: $PropertyType<DetailAllocation, 'allocationType'>
): Promise<DetailAllocation[]> => {
  return stakeDetails.allocations.filter(stakeDetail => stakeDetail.allocationType === allocationType)
}

export const getAllocationLocktimeMessage = (allocation: DetailAllocation) => {
  return allocation.locktime != null ? ` (${sprintf(s.strings.stake_lock_message, formatTimeDate(allocation.locktime))})` : ''
}

export const getRewardDetails = async (stakePlugin: StakePlugin, stakePolicyId: string, currencyWallet: EdgeCurrencyWallet) => {
  return stakePlugin.fetchStakeDetails({ stakePolicyId, wallet: currencyWallet })
}

export const getStakePolicyById = async (stakePlugin: StakePlugin, stakePolicyId: string): Promise<StakePolicy | void> => {
  return await stakePlugin.getStakePolicies().then(stakePolicies => stakePolicies.find(policy => policy.stakePolicyId === stakePolicyId))
}

export const getStakeAssetNames = (stakePolicy: StakePolicy) => {
  const stakeChainsArr = Object.keys(stakePolicy.stakeAssets)
  const stakeTokensArr = stakeChainsArr.map(chain => Object.keys(stakePolicy.stakeAssets[chain]))[0]
  const stakeAssetsName = stakeTokensArr.length > 1 ? `${stakeTokensArr.join('-')}-LP` : stakeTokensArr[0]
  return stakeAssetsName
}

export const getRewardAssetNames = (stakePolicy: StakePolicy) => {
  const rewardChainsArr = Object.keys(stakePolicy.rewardAssets)
  const rewardTokensArr = rewardChainsArr.map(chain => Object.keys(stakePolicy.rewardAssets[chain]))[0]
  const rewardAssetsName = rewardTokensArr.length > 1 ? `${rewardTokensArr.join(', ')}` : rewardTokensArr[0]
  return rewardAssetsName
}

export const getAssetDisplayName = (assetNames: string) => {
  return assetNames.length > 1 ? `${assetNames.join('-')}-LP` : assetNames[0]
}

// TODO: consolidate icon getters
export const getPolicyIconUris = (currencyWallet: EdgeCurrencyWallet, stakePolicy: StakePolicy): { stakeAssetUris: string[], rewardAssetUris: string[] } => {
  const stakeAssetNames = getStakeAssetNames(stakePolicy)
  const rewardAssetNames = getRewardAssetNames(stakePolicy)

  const stakeAssetUris = stakeAssetNames.map(stakeAsset => getCurrencyIconById(currencyWallet, stakeAsset.tokenId))
  const rewardAssetUris = rewardAssetNames.map(rewardAsset => getCurrencyIconById(currencyWallet, rewardAsset.tokenId))
  return { stakeAssetUris, rewardAssetUris }
}

export const getAllocationIconUris = (currencyWallet: EdgeCurrencyWallet, allocations: DetailAllocation[]): string[] => {
  return allocations.map(allocation => {
    return getCurrencyIconById(currencyWallet, allocation.tokenId)
  })
}
