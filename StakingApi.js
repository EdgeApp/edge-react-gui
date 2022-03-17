// @flow
import type { EdgeCurrencyWallet, EdgeToken, JsonObject } from 'edge-core-js'

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

export type ChangeQuote = {
  stakes: {
    [tokenId: string]: {
      nativeAmount: string
    }
  },
  claims: {
    [tokenId: string]: {
      nativeAmount: string
    }
  },
  unstakes: {
    [tokenId: string]: {
      nativeAmount: string
    }
  },

  fees: {
    [tokenId: string]: {
      networkFee: string
    }
  },

  approve: () => Promise<void>
}

// -----------------------------------------------------------------------------
// Stake Details
// -----------------------------------------------------------------------------

export type StakeDetailRequest = {
  stakePolicyId: string,
  wallet: EdgeCurrencyWallet
}

export type StakeDetails = {
  allocations: Array<{
    // The type of asset for this allocation
    token: EdgeToken,
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
    locktime?: Date,

    // Feel free to add other weird coin states here.
    // We can standardize them later if they are common:
    otherParams?: JsonObject
  }>
}

// -----------------------------------------------------------------------------
// Stake Plugin
// -----------------------------------------------------------------------------

export type StakePlugin = {
  getStakePolicies: () => Promise<StakePolicy[]>,
  fetchChangeQuote: (request: ChangeQuoteRequest) => Promise<ChangeQuote>,
  fetchStakeDetails: (request: StakeDetailRequest) => Promise<StakeDetails>
}
