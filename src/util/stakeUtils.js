// @flow

import type { StakeDetails } from '../plugins/stake-plugins'

// TODO: (V2) Hard-coded for single asset
export const getRewardAllocation = async (stakeDetails: StakeDetails) => {
  return stakeDetails.allocations.filter(stakeDetail => stakeDetail.allocationType === 'earned')[0]
}

// TODO: (V2) Hard-coded for single asset
export const getStakeAllocation = async (stakeDetails: StakeDetails) => {
  return stakeDetails.allocations.filter(stakeDetail => stakeDetail.allocationType === 'staked')[0]
}
