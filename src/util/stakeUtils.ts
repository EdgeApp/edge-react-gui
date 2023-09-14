import { EdgeCurrencyInfo } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { formatTimeDate } from '../locales/intl'
import { lstrings } from '../locales/strings'
import { PositionAllocation, StakePlugin, StakePolicy, StakePosition } from '../plugins/stake-plugins/types'
import { getCurrencyIconUris } from './CdnUris'

/**
 * Returns an array of all currency codes for a particular asset type
 */
const getAssetCurrencyCodes = (stakePolicy: StakePolicy, assetType: 'stakeAssets' | 'rewardAssets') => stakePolicy[assetType].map(asset => asset.currencyCode)

/**
 * Returns an array of all display names for a particular asset type
 */
const getAssetDisplayName = (stakePolicy: StakePolicy, assetType: 'stakeAssets' | 'rewardAssets') =>
  stakePolicy[assetType].map(asset => asset.displayName ?? asset.currencyCode)

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
  const assetCurrencyCodes = getAssetDisplayName(stakePolicy, assetType)
  const lpOrAssetCode = assetCurrencyCodes.length > 1 ? `${assetCurrencyCodes.join(' - ')} - LP` : assetCurrencyCodes[0]
  return lpOrAssetCode
}

/**
 * Returns the policy title
 */
export const getPolicyTitleName = (stakePolicy: StakePolicy) => {
  const stakeCurrencyCodes = getAssetDisplayName(stakePolicy, 'stakeAssets')
  const rewardCurrencyCodes = getAssetDisplayName(stakePolicy, 'rewardAssets')

  const stakeName = stakeCurrencyCodes.length > 1 ? `${stakeCurrencyCodes.join(' + ')}` : stakeCurrencyCodes[0]
  const rewardName = rewardCurrencyCodes.length > 1 ? `${rewardCurrencyCodes.join(' + ')}` : rewardCurrencyCodes[0]

  const { yieldType } = stakePolicy

  const yieldText = yieldType === 'stable' ? ` ${lstrings.stake_stable_yield}` : yieldType === 'variable' ? ` ${lstrings.stake_variable_yield}` : ''

  return `${sprintf(lstrings.stake_x_to_earn_y, stakeName, rewardName)}${yieldText}`
}

/**
 * Returns a formatted locked until timestamp, if it exists.
 */
export const getAllocationLocktimeMessage = (allocation: PositionAllocation) => {
  return allocation.locktime != null ? ` (${sprintf(lstrings.stake_lock_message, formatTimeDate(allocation.locktime))})` : ''
}

/**
 * Returns the icon uris of stake and reward assets.
 */
export const getPolicyIconUris = (
  { metaTokens, pluginId }: EdgeCurrencyInfo,
  stakePolicy: StakePolicy
): { stakeAssetUris: string[]; rewardAssetUris: string[] } => {
  const stakeAssetNames = getAssetCurrencyCodes(stakePolicy, 'stakeAssets')
  const rewardAssetNames = getAssetCurrencyCodes(stakePolicy, 'rewardAssets')

  const stakeContractAddresses = stakeAssetNames.map(
    (stakeAssetName, i) => stakePolicy.stakeAssets[i].cdnName ?? metaTokens.find(metaToken => metaToken.currencyCode === stakeAssetName)?.contractAddress
  )
  const rewardContractAddresses = rewardAssetNames.map(
    (rewardAssetName, i) => stakePolicy.rewardAssets[i].cdnName ?? metaTokens.find(metaToken => metaToken.currencyCode === rewardAssetName)?.contractAddress
  )

  const stakeAssetUris = stakeContractAddresses.map(stakeContractAddress => getCurrencyIconUris(pluginId, stakeContractAddress).symbolImage)
  const rewardAssetUris = rewardContractAddresses.map(rewardContractAddress => getCurrencyIconUris(pluginId, rewardContractAddress).symbolImage)

  return { stakeAssetUris, rewardAssetUris }
}

export const getPluginFromPolicy = (stakePlugins: StakePlugin[], stakePolicy: StakePolicy): StakePlugin | undefined => {
  return stakePlugins.find(plugin => plugin.getPolicies().find(policy => policy.stakePolicyId === stakePolicy.stakePolicyId))
}

export const getUnstakeText = (policy: StakePolicy): string => {
  return policy.rewardsNotClaimable ? lstrings.stake_unstake : lstrings.stake_unstake_claim
}
