// -----------------------------------------------------------------------------
// Stake Policy
// -----------------------------------------------------------------------------

import { EdgeCurrencyWallet } from 'edge-core-js'

export interface AssetId {
  pluginId: string
  currencyCode: string
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
  apy: number

  // The assets which can be earned
  rewardAssets: AssetId[]

  // The assets which must be staked
  stakeAssets: AssetId[]
}

// -----------------------------------------------------------------------------
// Change Quote
// -----------------------------------------------------------------------------
export interface ChangeQuoteRequest {
  action: 'stake' | 'unstake' | 'claim'
  stakePolicyId: string
  currencyCode: string
  nativeAmount: string
  wallet: EdgeCurrencyWallet
}

export interface QuoteAllocation {
  allocationType: 'stake' | 'unstake' | 'claim' | 'fee'
  pluginId: string
  currencyCode: string
  nativeAmount: string
}

export interface ChangeQuote {
  allocations: QuoteAllocation[]
  approve: () => Promise<void>
}

// -----------------------------------------------------------------------------
// Stake Position
// -----------------------------------------------------------------------------

export interface StakePositionRequest {
  stakePolicyId: string
  wallet: EdgeCurrencyWallet
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

export interface StakePlugin {
  policies: StakePolicy[]
  fetchChangeQuote: (request: ChangeQuoteRequest) => Promise<ChangeQuote>
  fetchStakePosition: (request: StakePositionRequest) => Promise<StakePosition>
}
