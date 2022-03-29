// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { formatTimeDate } from '../locales/intl'
import s from '../locales/strings'
import type { PositionAllocation, StakePlugin, StakePolicy, StakePosition } from '../plugins/stake-plugins'
import { makeStakePlugin } from '../plugins/stake-plugins'

// TODO: Get the plugin instance from the core context when the plugin is loaded into the core
export const stakePlugin = makeStakePlugin()

export const getStakePosition = async (stakePlugin: StakePlugin, stakePolicyId: string, currencyWallet: EdgeCurrencyWallet) => {
  return stakePlugin.fetchStakePosition({ stakePolicyId, wallet: currencyWallet })
}

export const getRewardAllocation = (stakePosition: StakePosition) => {
  return stakePosition.allocations.filter(stakeDetail => stakeDetail.allocationType === 'earned')[0]
}

export const getStakeAllocation = (stakePosition: StakePosition) => {
  return stakePosition.allocations.filter(stakeDetail => stakeDetail.allocationType === 'staked')[0]
}

export const getAllocationLocktimeMessage = (allocation: PositionAllocation) => {
  return allocation.locktime != null ? ` (${sprintf(s.strings.stake_lock_message, formatTimeDate(allocation.locktime))})` : ''
}

export const getStakeAssetsName = (stakePolicy: StakePolicy): string => {
  const stakeAssetCurrencyCodes = stakePolicy.stakeAssets.map(asset => asset.tokenId)
  const stakeAssetsName = stakeAssetCurrencyCodes.length > 1 ? `${stakeAssetCurrencyCodes.join('-')}-LP` : stakeAssetCurrencyCodes[0]
  return stakeAssetsName
}

export const getRewardAssetsName = (stakePolicy: StakePolicy): string => {
  const rewardAssetCurrencyCodes = stakePolicy.rewardAssets.map(asset => asset.tokenId)
  const rewardAssetsName = rewardAssetCurrencyCodes.length > 1 ? `${rewardAssetCurrencyCodes.join('-')}-LP` : rewardAssetCurrencyCodes[0]
  return rewardAssetsName
}
