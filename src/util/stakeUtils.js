// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { formatTimeDate } from '../locales/intl'
import s from '../locales/strings'
import type { DetailAllocation, StakeDetails, StakePlugin, StakePolicy } from '../plugins/stake-plugins'
import { makeStakePlugin } from '../plugins/stake-plugins'

// TODO: Get the plugin instance from the core context when the plugin is loaded into the core
export const stakePlugin = makeStakePlugin()

export const getStakeDetails = async (stakePlugin: StakePlugin, stakePolicyId: string, currencyWallet: EdgeCurrencyWallet) => {
  return stakePlugin.fetchStakeDetails({ stakePolicyId, wallet: currencyWallet })
}

export const getRewardAllocation = (stakeDetails: StakeDetails) => {
  return stakeDetails.allocations.filter(stakeDetail => stakeDetail.allocationType === 'earned')[0]
}

export const getStakeAllocation = (stakeDetails: StakeDetails) => {
  return stakeDetails.allocations.filter(stakeDetail => stakeDetail.allocationType === 'staked')[0]
}

export const getAllocationLocktimeMessage = (allocation: DetailAllocation) => {
  return allocation.locktime != null ? ` (${sprintf(s.strings.stake_lock_message, formatTimeDate(allocation.locktime))})` : ''
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
