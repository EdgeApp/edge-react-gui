// -----------------------------------------------------------------------------
// Stake Policy
// -----------------------------------------------------------------------------

import { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

// -----------------------------------------------------------------------------
// Errors
// -----------------------------------------------------------------------------

/**
 * Trying to stake or unstake an amount that is too low.
 * @param nativeMin the minimum supported amount, in the currency specified
 */
export class StakeBelowLimitError extends Error {
  name: string
  request: ChangeQuoteRequest
  currencyCode: string
  nativeMin?: string

  constructor(request: ChangeQuoteRequest, currencyCode: string, nativeMin?: string) {
    super('Amount is too low')
    this.currencyCode = currencyCode
    this.name = 'StakeBelowLimitError'
    this.nativeMin = nativeMin
    this.request = request
  }
}

/**
 * Trying to stake or unstake an amount that is too low.
 * @param nativeMin the minimum supported amount, in the currency specified
 */
export class StakePoolFullError extends Error {
  name: string
  request: ChangeQuoteRequest
  currencyCode: string

  constructor(request: ChangeQuoteRequest, currencyCode: string) {
    super('Staking Pool Full')
    this.currencyCode = currencyCode
    this.name = 'StakePoolFullError'
    this.request = request
  }
}

export interface AssetId {
  pluginId: string
  currencyCode: string
  displayName?: string
  cdnName?: string
}

// Defines what to display so that the user can identify the service provider
// of the staking policy.
export interface StakeProviderInfo {
  // Card subtitle
  displayName: string

  // CDN icon
  pluginId: string
  stakeProviderId: string
}

export interface StakePolicy {
  // Internal policy id, unique across all stake policies offered by Edge
  stakePolicyId: string

  // Some unique grouping information to display in the policy card to
  // differentiate between stake policies that share the same input stakeAssets
  stakeProviderInfo?: StakeProviderInfo

  // A percentage number representing the yield per year
  apy?: number
  yieldType?: 'stable' | 'variable'

  // The assets which can be earned
  rewardAssets: AssetId[]
  rewardsNotClaimable?: boolean

  // The assets which must be staked
  stakeAssets: AssetId[]

  // Warnings
  // string => show string as warning
  // null => show no warning
  // undefined => show default warning (used for Tomb finance)
  // TODO: Needs better architecture so strings are not declared in the plugin
  stakeWarning?: string | null
  unstakeWarning?: string | null
  claimWarning?: string | null

  // Do not allow Max button when staking
  disableMaxStake?: boolean
  mustMaxUnstake?: boolean

  // Policy is no longer active for staking
  deprecated?: boolean
}

// -----------------------------------------------------------------------------
// Change Quote
// -----------------------------------------------------------------------------
export interface ChangeQuoteRequest {
  action: 'stake' | 'unstake' | 'claim' | 'unstakeExact'
  stakePolicyId: string
  currencyCode: string
  nativeAmount: string
  wallet: EdgeCurrencyWallet
  account: EdgeAccount
}

export interface QuoteAllocation {
  allocationType: 'stake' | 'unstake' | 'claim' | 'networkFee' | 'deductedFee' | 'futureUnstakeFee'
  pluginId: string
  currencyCode: string
  nativeAmount: string
}

export interface QuoteInfo {
  breakEvenDays?: number
}

export interface ChangeQuote {
  allocations: QuoteAllocation[]
  quoteInfo?: QuoteInfo
  approve: () => Promise<void>
}

// -----------------------------------------------------------------------------
// Stake Position
// -----------------------------------------------------------------------------

export interface StakePositionRequest {
  stakePolicyId: string
  wallet: EdgeCurrencyWallet
  account: EdgeAccount
}

export interface PositionAllocation {
  // The of asset for this allocation
  pluginId: string
  currencyCode: string
  // The of the allocation
  allocationType: 'staked' | 'unstaked' | 'earned'
  // Amount of the asset allocated
  nativeAmount: string
  /*
  A date/time when the allocation is available.
  Example: earned allocations with a future date are not available,
  but earned allocations with a past date are available to be earned.
  For some tokens (e.g. FIO), there is no earned allocation; rather there is
  an unstaked allocation which is locked until the date.
  */
  locktime?: Date
}

export interface StakePosition {
  allocations: PositionAllocation[]
  canStake: boolean
  canUnstake: boolean
  canClaim: boolean
}

// -----------------------------------------------------------------------------
// Stake Plugin
// -----------------------------------------------------------------------------

export interface StakePolicyFilter {
  wallet?: EdgeCurrencyWallet
  currencyCode?: string
}

export const filterStakePolicies = (policies: StakePolicy[], filter?: StakePolicyFilter): StakePolicy[] => {
  if (filter == null) return policies

  let out: StakePolicy[] = [...policies]
  const { currencyCode, wallet } = filter

  if (wallet != null) {
    out = out.filter(policy => [...policy.rewardAssets, ...policy.stakeAssets].some(asset => asset.pluginId === wallet.currencyInfo.pluginId))
  }
  if (currencyCode != null) {
    out = out.filter(policy => [...policy.rewardAssets, ...policy.stakeAssets].some(asset => asset.currencyCode === currencyCode))
  }
  return out
}

export interface StakePlugin {
  getPolicies: (filter?: StakePolicyFilter) => StakePolicy[]
  fetchChangeQuote: (request: ChangeQuoteRequest) => Promise<ChangeQuote>
  fetchStakePosition: (request: StakePositionRequest) => Promise<StakePosition>
}
