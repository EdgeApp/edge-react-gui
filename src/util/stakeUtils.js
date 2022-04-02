// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { formatTimeDate } from '../locales/intl'
import s from '../locales/strings'
import { makeStakePlugin } from '../plugins/stake-plugins'
import { type PositionAllocation, type StakePlugin, type StakePolicy, type StakePosition } from '../plugins/stake-plugins/types'
import { getCurrencyIcon } from './CurrencyInfoHelpers'

export const getStakePosition = async (stakePlugin: StakePlugin, stakePolicyId: string, currencyWallet: EdgeCurrencyWallet) => {
  return stakePlugin.fetchStakePosition({ stakePolicyId, wallet: currencyWallet })
}

export const getRewardAllocation = (stakePosition: StakePosition) => {
  return stakePosition.allocations.filter(stakeDetail => stakeDetail.allocationType === 'earned')[0]
}

export const getStakeAllocation = (stakePosition: StakePosition) => {
  return stakePosition.allocations.filter(stakeDetail => stakeDetail.allocationType === 'staked')[0]
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

// TODO: Deprecate above

// TODO: Get the plugin instance from the core context when the plugin is loaded into the core
export const stakePlugin = makeStakePlugin()

/**
 * Returns an array of all currency codes for a particular asset type
 */
const getAssetCurrencyCodes = (stakePolicy: StakePolicy, assetType: 'stakeAssets' | 'rewardAssets') => stakePolicy[assetType].map(asset => asset.tokenId)

/**
 * Returns staked and earned allocations in a shape that makes sense for the GUI
 */
export const getPositionAllocations = (stakePosition: StakePosition) => {
  return {
    staked: stakePosition.allocations.filter(positionAllocation => positionAllocation.allocationType === 'staked'),
    earned: stakePosition.allocations.filter(positionAllocation => positionAllocation.allocationType === 'earned')
  }
}

/**
 * Returns the asset display name. Converts multiple assets into their LP name
 */
export const getPolicyAssetName = (stakePolicy: StakePolicy, assetType: 'stakeAssets' | 'rewardAssets'): string => {
  const assetCurrencyCodes = getAssetCurrencyCodes(stakePolicy, assetType)
  // TODO: Ensure LP asset order
  const lpOrAssetCode = assetCurrencyCodes.length > 1 ? `${assetCurrencyCodes.join(' - ')} - LP` : assetCurrencyCodes[0]
  return lpOrAssetCode
}

/**
 * Returns the policy title
 */
export const getPolicyTitleName = (stakePolicy: StakePolicy) => {
  const stakeCurrencyCodes = getAssetCurrencyCodes(stakePolicy, 'stakeAssets')
  const rewardCurrencyCodes = getAssetCurrencyCodes(stakePolicy, 'rewardAssets')

  const stakeName = stakeCurrencyCodes.length > 1 ? `${stakeCurrencyCodes.join(' + ')}` : stakeCurrencyCodes[0]
  const rewardName = rewardCurrencyCodes.length > 1 ? `${rewardCurrencyCodes.join(' + ')}` : rewardCurrencyCodes[0]

  return sprintf(s.strings.stake_x_to_earn_y, stakeName, rewardName)
}

/**
 * Returns a formatted locked until timestamp, if it exists.
 */
export const getAllocationLocktimeMessage = (allocation: PositionAllocation) => {
  return allocation.locktime != null ? ` (${sprintf(s.strings.stake_lock_message, formatTimeDate(allocation.locktime))})` : ''
}

/**
 * Returns the icon uris of stake and reward assets.
 */
export const getPolicyIconUris = (currencyWallet: EdgeCurrencyWallet, stakePolicy: StakePolicy): { stakeAssetUris: string[], rewardAssetUris: string[] } => {
  const stakeAssetNames = getAssetCurrencyCodes(stakePolicy, 'stakeAssets')
  const rewardAssetNames = getAssetCurrencyCodes(stakePolicy, 'rewardAssets')

  const metaTokens = currencyWallet.currencyInfo.metaTokens
  const stakeContractAddresses = stakeAssetNames.map(stakeAssetName => metaTokens.find(metaToken => metaToken.currencyCode === stakeAssetName)?.contractAddress)
  const rewardContractAddresses = rewardAssetNames.map(
    rewardAssetName => metaTokens.find(metaToken => metaToken.currencyCode === rewardAssetName)?.contractAddress
  )

  const stakeAssetUris = stakeContractAddresses.map(
    stakeContractAddress => getCurrencyIcon(currencyWallet.currencyInfo.pluginId, stakeContractAddress).symbolImage
  )
  const rewardAssetUris = rewardContractAddresses.map(
    rewardContractAddress => getCurrencyIcon(currencyWallet.currencyInfo.pluginId, rewardContractAddress).symbolImage
  )

  return { stakeAssetUris, rewardAssetUris }
}
