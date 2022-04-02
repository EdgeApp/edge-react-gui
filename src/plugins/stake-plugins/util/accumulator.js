// @flow
import { type BigNumberish, BigNumber } from 'ethers'

export type BigAccumulator = (n?: BigNumberish) => BigNumber

export const makeBigAccumulator = (init = BigNumber.from(0)) => {
  let accumulator = BigNumber.from(init)
  const accumulate = n => {
    // Set
    if (n != null) {
      n = BigNumber.from(n)
      accumulator = accumulator.add(n)
      return n
    }

    // Get
    return accumulator
  }

  return accumulate
}
