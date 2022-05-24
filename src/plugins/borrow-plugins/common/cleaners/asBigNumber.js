// @flow

import { type Cleaner } from 'cleaners'
import { BigNumber } from 'ethers'

export const asBigNumber: Cleaner<BigNumber> = (raw: any): BigNumber => {
  if (raw instanceof BigNumber) return raw
}
