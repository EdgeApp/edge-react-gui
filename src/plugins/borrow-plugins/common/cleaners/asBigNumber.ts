import type { Cleaner } from 'cleaners'
import { BigNumber } from 'ethers'

// @ts-expect-error Returns undefined for anything that isn't a BigNumber
export const asBigNumber: Cleaner<BigNumber> = (raw: any): BigNumber => {
  if (raw instanceof BigNumber) return raw
}
