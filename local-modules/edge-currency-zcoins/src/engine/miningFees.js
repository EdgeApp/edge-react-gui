/**
 * Created by Paul Puey on 2017/11/09
 * @flow
 */

import { bns } from 'biggystring'

import type { BitcoinFees, EarnComFees } from '../utils/flowTypes.js'
import { EarnComFeesSchema } from '../utils/jsonSchemas.js'
import { logger } from '../utils/logger.js'
import { validateObject } from '../utils/utils.js'

export const ES_FEE_LOW = 'low'
export const ES_FEE_STANDARD = 'standard'
export const ES_FEE_HIGH = 'high'
export const ES_FEE_CUSTOM = 'custom'

const MAX_FEE = 999999999.0
const MAX_STANDARD_DELAY = 3
const MIN_STANDARD_DELAY = 1

/**
 * Calculate the BitcoinFees object given a default BitcoinFees object and EarnComFees
 * @param bitcoinFees
 * @param earnComFees
 * @returns {BitcoinFees}
 */
export function calcFeesFromEarnCom (earnComFeesJson: any): $Shape<BitcoinFees> {
  let highDelay = 999999
  let lowDelay = 0
  let highFee = MAX_FEE
  let standardFeeHigh
  let standardFeeLow = MAX_FEE
  let lowFee = MAX_FEE

  const earnComData = {
    fees: earnComFeesJson
  }
  const valid = validateObject(earnComData, EarnComFeesSchema)
  if (!valid) {
    logger.info('Not valid fee data structure from vendor')
    return {}
  }

  const earnComFees: EarnComFees = earnComData
  for (const fee of earnComFees.fees) {
    // If this is a zero fee estimate, then skip
    if (fee.maxFee === 0 || fee.minFee === 0) {
      continue
    }

    // Set the lowFee if the delay in blocks and minutes is less that 10000.
    // 21.co uses 10000 to mean infinite
    if (fee.maxDelay < 10000 && fee.maxMinutes < 10000) {
      if (fee.maxFee < lowFee) {
        // Set the low fee if the current fee estimate is lower than the previously set low fee
        lowDelay = fee.maxDelay
        lowFee = fee.maxFee
      }
    }

    // Set the high fee only if the delay is 0
    if (fee.maxDelay === 0) {
      if (fee.maxFee < highFee) {
        // Set the low fee if the current fee estimate is lower than the previously set high fee
        highFee = fee.minFee
        highDelay = fee.maxDelay
      }
    }
  }

  // Now find the standard fee range. We want the range to be within a maxDelay of
  // 3 to 18 blocks (about 30 mins to 3 hours). The standard fee at the low end should
  // have a delay less than the lowFee from above. The standard fee at the high end
  // should have a delay that's greater than the highFee from above.
  for (const fee of earnComFees.fees) {
    // If this is a zero fee estimate, then skip
    if (fee.maxFee === 0 || fee.minFee === 0) {
      continue
    }

    if (fee.maxDelay < lowDelay && fee.maxDelay <= MAX_STANDARD_DELAY) {
      if (standardFeeLow > fee.minFee) {
        standardFeeLow = fee.minFee
      }
    }
  }

  // Go backwards looking for lowest standardFeeHigh that:
  // 1. Is < highFee
  // 2. Has a blockDelay > highDelay
  // 3. Has a delay that is > MIN_STANDARD_DELAY
  // Use the highFee as the default standardHighFee
  standardFeeHigh = highFee
  for (let i = earnComFees.fees.length - 1; i >= 0; i--) {
    const fee = earnComFees.fees[i]

    if (i < 0) {
      break
    }

    // If this is a zero fee estimate, then skip
    if (fee.maxFee === 0 || fee.minFee === 0) {
      continue
    }

    // Dont ever go below standardFeeLow
    if (fee.maxFee <= standardFeeLow) {
      break
    }

    if (fee.maxDelay > highDelay) {
      standardFeeHigh = fee.maxFee
    }

    // If we have a delay that's greater than MIN_STANDARD_DELAY, then we're done.
    // Otherwise we'd be getting bigger delays and further reducing fees.
    if (fee.maxDelay >= MIN_STANDARD_DELAY) {
      break
    }
  }

  //
  // Check if we have a complete set of fee info.
  //
  if (
    highFee < MAX_FEE &&
    lowFee < MAX_FEE &&
    standardFeeHigh > 0 &&
    standardFeeLow < MAX_FEE
  ) {
    // Overwrite the fees with those from earn.com
    const out: $Shape<BitcoinFees> = {
      lowFee: lowFee.toFixed(0),
      standardFeeLow: standardFeeLow.toFixed(0),
      standardFeeHigh: standardFeeHigh.toFixed(0),
      highFee: highFee.toFixed(0)
    }

    return out
  } else {
    return {}
  }
}

/**
 * Calculate the sat/byte mining fee given an amount to spend and a BitcoinFees object
 * @param nativeAmount
 * @param feeOption
 * @param customFee
 * @param bitcoinFees
 * @returns {string}
 */
export function calcMinerFeePerByte (
  nativeAmount: string,
  feeOption: string,
  bitcoinFees: BitcoinFees,
  customFee: string = '0'
): string {
  if (feeOption === ES_FEE_CUSTOM && customFee !== '0') return customFee
  let satoshiPerByteFee: string = '0'
  switch (feeOption) {
    case ES_FEE_LOW:
      satoshiPerByteFee = bitcoinFees.lowFee
      break
    case ES_FEE_STANDARD:
      if (bns.gte(nativeAmount, bitcoinFees.standardFeeHighAmount)) {
        satoshiPerByteFee = bitcoinFees.standardFeeHigh
        break
      }
      if (bns.lte(nativeAmount, bitcoinFees.standardFeeLowAmount)) {
        satoshiPerByteFee = bitcoinFees.standardFeeLow
        break
      }

      // Scale the fee by the amount the user is sending scaled between standardFeeLowAmount and standardFeeHighAmount
      const lowHighAmountDiff = bns.sub(
        bitcoinFees.standardFeeHighAmount,
        bitcoinFees.standardFeeLowAmount
      )
      const lowHighFeeDiff = bns.sub(
        bitcoinFees.standardFeeHigh,
        bitcoinFees.standardFeeLow
      )

      // How much above the lowFeeAmount is the user sending
      const amountDiffFromLow = bns.sub(
        nativeAmount,
        bitcoinFees.standardFeeLowAmount
      )

      // Add this much to the low fee = (amountDiffFromLow * lowHighFeeDiff) / lowHighAmountDiff)
      const temp1 = bns.mul(amountDiffFromLow, lowHighFeeDiff)
      const addFeeToLow = bns.div(temp1, lowHighAmountDiff)
      satoshiPerByteFee = bns.add(bitcoinFees.standardFeeLow, addFeeToLow)
      break
    case ES_FEE_HIGH:
      satoshiPerByteFee = bitcoinFees.highFee
      break
    default:
      throw new Error(
        `Invalid networkFeeOption: ${feeOption}, And/Or customFee: ${customFee}`
      )
  }
  return satoshiPerByteFee
}
