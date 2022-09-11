import { Cleaner } from 'cleaners'
import { BigNumber } from 'ethers'

// @ts-expect-error
export const asBigNumber: Cleaner<BigNumber> = (raw: any): BigNumber => {
  if (raw instanceof BigNumber) return raw
}
