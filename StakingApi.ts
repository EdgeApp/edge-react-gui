// ---------------------------------------------------------------------
// Stake API
// ---------------------------------------------------------------------

interface StakePlugin {
  getStakePolicies: () => Promise<StakePolicy[]>
  fetchStakeQuote: (request: StakeQuoteRequest) => Promise<StakeQuote>
  fetchStakeDetails: (request: StakeDetailRequest) => StakeDetails
}

// Staking Policy
// ---------------------------------------------------------------------

// Not sure if this is going be enough because how "LP-staking" works;
// Need to figure out how we deal with LP pool asset-ratios.
type StakePolicy = {
  // Perhaps we need a UUID for each policy?
  policyId: string

  // The assets which must be staked
  stakeAssets: {
    [pluginId: string]: {
      [tokenId: string]: boolean
    }
  }
  
  // The assets which can be earned
  rewardsAssets: {
    [pluginId: string]: {
      [tokenId: string]: boolean
    }
  }
  
  
  // Whether claim action is required to obtain reward
  mustClaimRewards: boolean
}


// Stake Quote
// ---------------------------------------------------------------------

interface StakeQuoteRequest {
  policyId: string
  wallet: EdgeCurrencyWallet
  tokenId: string
  nativeAmount: string
}

interface StakeQuote {
  stakes: {
    [tokenId: string]: {
      nativeAmount: string
    }
  }

  fees: {
    [tokenId: string]: {
      networkFee: string
    }
  }

  approve: () => Promise<void>
}

interface StakeDetailRequest {
  policyId: string
  wallet: EdgeCurrencyWallet
}

// Stake Details
// ---------------------------------------------------------------------

type StakeDetails = {
  allocations: Array<{
    // The type of asset for this allocation
    token: EdgeToken,
    // The type of the allocation
    allocationType: 'staked' | 'unstaked' | 'earned'
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