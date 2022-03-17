// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'

// -----------------------------------------------------------------------------
// Stake Policy
// -----------------------------------------------------------------------------

// Not sure if this is going be enough because how "LP-staking" works;
// Need to figure out how we deal with LP pool asset-ratios.
export type StakePolicy = {
  // Perhaps we need a UUID for each policy?
  stakePolicyId: string,

  // A percentage number representing the yield per year
  apy: number,

  // The assets which must be staked
  stakeAssets: {
    [pluginId: string]: {
      [tokenId: string]: boolean
    }
  },

  // The assets which can be earned
  rewardAssets: {
    [pluginId: string]: {
      [tokenId: string]: boolean
    }
  },

  // Whether claim action is required to obtain reward
  mustClaimRewards: boolean
}

// -----------------------------------------------------------------------------
// Change Quote
// -----------------------------------------------------------------------------
export type ChangeQuoteRequest = {
  action: 'stake' | 'unstake' | 'claim',
  stakePolicyId: string,
  tokenId: string,
  nativeAmount: string,
  wallet: EdgeCurrencyWallet
}

export type QuoteAllocation = {
  allocationType: 'stake' | 'unstake' | 'claim' | 'fee',
  tokenId: string,
  nativeAmount: string
}

export type ChangeQuote = {
  allocations: QuoteAllocation[],
  approve: () => Promise<void>
}

// -----------------------------------------------------------------------------
// Stake Details
// -----------------------------------------------------------------------------

export type StakeDetailRequest = {
  stakePolicyId: string,
  wallet: EdgeCurrencyWallet
}

export type DetailAllocation = {
  // The type of asset for this allocation
  tokenId: string,
  // The type of the allocation
  allocationType: 'staked' | 'unstaked' | 'earned',
  // Amount of the asset allocated
  nativeAmount: string,
  /*
  A date/time when the allocation is available.
  Example: earned allocations with a future date are not available,
  but earned allocations with a past date are available to be earned.
  For some tokens (e.g. FIO), there is no earned allocation; rather there is
  an unstaked allocation which is locked until the date.
  */
  locktime?: Date
}

export type StakeDetails = {
  allocations: DetailAllocation[]
}

// -----------------------------------------------------------------------------
// Stake Plugin
// -----------------------------------------------------------------------------

export type StakePlugin = {
  getStakePolicies: () => Promise<StakePolicy[]>,
  fetchChangeQuote: (request: ChangeQuoteRequest) => Promise<ChangeQuote>,
  fetchStakeDetails: (request: StakeDetailRequest) => Promise<StakeDetails>
}
