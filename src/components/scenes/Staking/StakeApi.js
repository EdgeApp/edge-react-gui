// @flow
import type { EdgeCurrencyWallet, JsonObject } from 'edge-core-js'

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
  allocations: Array<{
    allocationType: 'stake' | 'unstake' | 'claim' | 'fee',
    tokenId: string,
    nativeAmount: string
  }>,

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
    tokenId: string, // Possibly not needed

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

export const getFakeStakePlugin = (): StakePlugin => {
  return {
    getStakePolicies: async (): Promise<StakePolicy[]> => {
      return [
        {
          stakePolicyId: 'TOMB->TSHARE',
          stakeAssets: {
            fantom: {
              TSHARE: true
            }
          },
          rewardAssets: {
            fantom: {
              TOMB: true
            }
          },
          mustClaimRewards: true,
          apy: 20000
        },
        {
          stakePolicyId: 'TOMB-FTM->TSHARE',
          stakeAssets: {
            fantom: {
              TOMB: true,
              FTM: true
            }
          },
          rewardAssets: {
            fantom: {
              TSHARE: true
            }
          },
          mustClaimRewards: true,
          apy: 20000
        },
        {
          stakePolicyId: 'TSHARE-FTM->TSHARE',
          stakeAssets: {
            fantom: {
              TSHARE: true,
              FTM: true
            }
          },
          rewardAssets: {
            fantom: {
              TSHARE: true
            }
          },
          mustClaimRewards: true,
          apy: 20000
        }
      ]
    },
    fetchChangeQuote: async (request: ChangeQuoteRequest): Promise<ChangeQuote> => {
      return {
        allocations: [
          {
            allocationType: 'stake',
            tokenId: 'TOMB',
            nativeAmount: '10000000000'
          },
          {
            allocationType: 'stake',
            tokenId: 'FTM',
            nativeAmount: '500000'
          }
        ],
        approve: async (): Promise<void> => {
          console.log('\x1b[30m\x1b[42mapproved!\x1b[0m')
        }
      }
    },
    fetchStakeDetails: async (request: StakeDetailRequest): Promise<StakeDetails> => {
      return {
        allocations: [
          {
            tokenId: 'TSHARE',
            allocationType: 'staked',
            nativeAmount: '512000000000000000000'
            // lockTime:
          },
          {
            tokenId: 'TOMB',
            allocationType: 'earned',
            nativeAmount: '1337000000000000000'
            // lockTime:
          }
        ]
      }
    }
  }
}
