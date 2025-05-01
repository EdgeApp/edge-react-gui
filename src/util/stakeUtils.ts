import { add, round } from 'biggystring'
import { EdgeAccount, EdgeCurrencyWallet, EdgeStakingStatus, EdgeTokenId } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { formatTimeDate } from '../locales/intl'
import { lstrings } from '../locales/strings'
import { PositionAllocation, StakeAssetInfo, StakePlugin, StakePolicy, StakePolicyFilter, StakePosition } from '../plugins/stake-plugins/types'
import { EdgeAsset } from '../types/types'
import { getCurrencyIconUris } from './CdnUris'
import { getTokenIdForced } from './CurrencyInfoHelpers'
import { enableTokens } from './CurrencyWalletHelpers'
import { getUkCompliantString } from './ukComplianceUtils'

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
    earned: stakePosition.allocations.filter(positionAllocation => positionAllocation.allocationType === 'earned'),
    unstaked: stakePosition.allocations.filter(positionAllocation => positionAllocation.allocationType === 'unstaked')
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
export const getPolicyTitleName = (stakePolicy: StakePolicy, countryCode?: string) => {
  const stakeCurrencyCodes = getAssetDisplayName(stakePolicy, 'stakeAssets')
  const rewardCurrencyCodes = getAssetDisplayName(stakePolicy, 'rewardAssets')

  const stakeName = stakeCurrencyCodes.length > 1 ? `${stakeCurrencyCodes.join(' + ')}` : stakeCurrencyCodes[0]
  const rewardName = rewardCurrencyCodes.length > 1 ? `${rewardCurrencyCodes.join(' + ')}` : rewardCurrencyCodes[0]

  const { yieldType } = stakePolicy

  const yieldText = yieldType === 'stable' ? ` ${lstrings.stake_stable_yield}` : yieldType === 'variable' ? ` ${lstrings.stake_variable_yield}` : ''

  return `${getUkCompliantString(countryCode, 'stake_x_to_earn_y', stakeName, rewardName)}${yieldText}`
}

/**
 * Returns a formatted locked until timestamp, if it exists and is a future date.
 */
export const getAllocationLocktimeMessage = (allocation: PositionAllocation) => {
  return allocation.locktime != null && new Date(allocation.locktime) > new Date()
    ? ` (${sprintf(lstrings.stake_lock_message, formatTimeDate(allocation.locktime))})`
    : ''
}

/**
 * Returns the icon uris of stake and reward assets.
 */
export const getPolicyIconUris = (
  currencyConfigs: EdgeAccount['currencyConfig'],
  stakePolicy: StakePolicy
): { stakeAssetUris: string[]; rewardAssetUris: string[] } => {
  const assetInfosToEdgeTokens = (assetInfos: StakeAssetInfo[]) => {
    const edgeAssets: EdgeAsset[] = []

    for (const stakeAsset of assetInfos) {
      const pluginId = stakeAsset.pluginId
      const currencyCode = stakeAsset.currencyCode

      const currencyConfig = currencyConfigs[pluginId]

      if (currencyCode === currencyConfig.currencyInfo.currencyCode) {
        edgeAssets.push({ pluginId, tokenId: null })
        continue
      }
      const tokenId = Object.keys(currencyConfig.allTokens).find(tokenId => currencyConfig.allTokens[tokenId].currencyCode === currencyCode)
      if (tokenId == null) continue

      edgeAssets.push({ pluginId, tokenId })
    }
    return edgeAssets
  }

  const stakeAssets = assetInfosToEdgeTokens(stakePolicy.stakeAssets)
  const rewardAssets = assetInfosToEdgeTokens(stakePolicy.rewardAssets)

  const stakeAssetUris = stakeAssets.map(
    asset => getCurrencyIconUris(asset.pluginId, asset.tokenId, SPECIAL_CURRENCY_INFO[asset.pluginId]?.chainIcon ?? false).symbolImage
  )
  const rewardAssetUris = rewardAssets.map(
    asset => getCurrencyIconUris(asset.pluginId, asset.tokenId, SPECIAL_CURRENCY_INFO[asset.pluginId]?.chainIcon ?? false).symbolImage
  )

  return { stakeAssetUris, rewardAssetUris }
}

export const getPluginFromPolicyId = (stakePlugins: StakePlugin[], stakePolicyId: string, filter?: StakePolicyFilter): StakePlugin | undefined => {
  return stakePlugins.find(plugin => plugin.getPolicies(filter).find(policy => policy.stakePolicyId === stakePolicyId))
}

/**
 * FIO specific staking util functions. FIO still uses a direct connection
 * to the FIO plugin for staking info instead of the newer staking plugin
 * architecture. Extract balance info using the stakingStatus similar to how
 * the tronStakePlugin does for BANDWIDTH and ENERYGY
 */

/**
 * `locked` signifies total locked balance that is not spendable
 * `staked` signifies subset of locked balance that is locked
 */
export type FioStakingBalanceType = 'staked' | 'locked'
export type FioStakingBalances = Record<FioStakingBalanceType, string>

export const getFioStakingBalances = (stakingStatus?: EdgeStakingStatus): FioStakingBalances => {
  const stakingBalances: FioStakingBalances = {
    staked: '0',
    locked: '0'
  }

  for (const stakedAmount of stakingStatus?.stakedAmounts ?? []) {
    const type = stakedAmount.otherParams?.type
    if (type === 'STAKED') {
      stakingBalances.staked = add(stakingBalances.staked, stakedAmount.nativeAmount)
    } else if (type === 'LOCKED') {
      stakingBalances.locked = add(stakingBalances.locked, stakedAmount.nativeAmount)
    }
  }
  return stakingBalances
}

export const enableStakeTokens = async (account: EdgeAccount, wallet: EdgeCurrencyWallet, stakePolicy: StakePolicy) => {
  const requiredTokenIds: EdgeTokenId[] = []
  for (const stakeAssetInfo of [...stakePolicy.stakeAssets, ...stakePolicy.rewardAssets]) {
    const pluginId = wallet.currencyInfo.pluginId
    const tokenId = getTokenIdForced(account, pluginId, stakeAssetInfo.currencyCode)
    requiredTokenIds.push(tokenId)
  }

  await enableTokens(requiredTokenIds, wallet)
}

export const getBestApy = (stakePolicies: StakePolicy[]) => {
  return stakePolicies.reduce((prev, curr) => Math.max(prev, curr.apy ?? 0), 0)
}

/**
 * Return the best APY found, defaulting to 1 decimal place, rounding to the
 * nearest whole number if >= 10, and truncating to '>99%' if greater than 99%.
 * Only returns a value if `stakePolicies` is available.
 */
export const getBestApyText = (stakePolicies?: StakePolicy[]): string | undefined => {
  if (stakePolicies == null || stakePolicies.length === 0) return
  const bestApy = stakePolicies.reduce((prev, curr) => Math.max(prev, curr.apy ?? 0), 0)
  if (bestApy === 0) return

  const precision = Math.log10(bestApy) > 1 ? 0 : -1
  return round(bestApy.toString(), precision) + '%'
}

/**
 * Returns true if staking is supported for the given currency code and
 * pluginId.
 */
export const isStakingSupported = (pluginId: string): boolean => {
  return SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported === true
}
