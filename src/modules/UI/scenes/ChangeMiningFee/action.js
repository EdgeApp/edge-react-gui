// @flow

import { CHANGE_MINING_FEE } from '../SendConfirmation/selectors'
import { STANDARD_FEE } from '../../../../constants/indexConstants'

export const changeFee = (networkFeeOption: string, customNetworkFee: any) => ({
  type: CHANGE_MINING_FEE,
  data: { networkFeeOption, customNetworkFee }
})

export const resetFees = () => ({
  type: CHANGE_MINING_FEE,
  data: {
    networkFeeOption: STANDARD_FEE,
    customNetworkFee: {}
  }
})
