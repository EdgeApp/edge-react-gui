// @flow

// import Big from 'big.js'
import Big from 'big.js'
import { div, eq, gte, lt, mul, toFixed } from 'biggystring'

export const DECIMAL_PRECISION = 18

// ************************************** //
// *********** Helper Methods *********** //
// ************************************** //

// Used to reject non-numeric (expect '.') values in the FlipInput
export const isValidInput = (input: string): boolean =>
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Unary_plus_()
  !isNaN(+input) || input === '.'

export const zeroString = (input: any): boolean => input == null || typeof input !== 'string' || input === '' || eq(input, '0')

export const decimalOrZero = (input: string, decimalPlaces: number): string => {
  if (gte(input, '1')) {
    // do nothing to numbers greater than one
    return input
  } else {
    const truncatedToDecimals = toFixed(input, decimalPlaces, decimalPlaces)
    if (eq(truncatedToDecimals, '0')) {
      // cut off to number of decimal places equivalent to zero?
      return '0' // then return zero
    } else {
      // if not equivalent to zero
      return truncatedToDecimals.replace(/0+$/, '') // then return the truncation
    }
  }
}

// Used to limit the decimals of a displayAmount
// TODO every function that calls this function needs to be flowed
export const truncateDecimals = (input: string, precision: number, allowBlank: boolean = false): string => {
  if (input === '') {
    if (allowBlank) {
      input = ''
    } else {
      input = '0'
    }
  }
  if (!input.includes('.')) {
    return input
  }
  const [integers, decimals] = input.split('.')
  return precision > 0 ? `${integers}.${decimals.slice(0, precision)}` : integers
}

// Counts zeros after decimal place in number. '0.00036' => 3
export const zerosAfterDecimal = (num: string): number => num.match(/(\.0*)/)?.[0].slice(1).length ?? 0

// ****************************************** //
// *********** Conversion Methods *********** //
// ****************************************** //

export const convertNumberToRoundedDecimal = (number: string, precision: number): string =>
  Big(number)
    .round(precision + zerosAfterDecimal(number), Big.roundUp)
    .toFixed()

export const convertFeeToRoundedFee = (number: string, divider: string = '1', precision: number = 2) => {
  try {
    const bigNum = Big(number).div(divider).toFixed()
    const roundNum = convertNumberToRoundedDecimal(bigNum, precision)
    return roundNum === '' ? roundNum : `${roundNum} `
  } catch (e) {
    return ''
  }
}

export function precisionAdjust(params: PrecisionAdjustParams): number {
  const exchangeSecondaryToPrimaryRatio = parseFloat(params.exchangeSecondaryToPrimaryRatio)
  const order = Math.floor(Math.log(exchangeSecondaryToPrimaryRatio) / Math.LN10 + 0.000000001) // because float math sucks like that
  const exchangeRateOrderOfMagnitude = Math.pow(10, order)

  // Get the exchange rate in tenth of pennies
  const exchangeRateString = mul(exchangeRateOrderOfMagnitude.toString(), mul(params.secondaryExchangeMultiplier, '10'))

  const precisionAdjust = div(exchangeRateString, params.primaryExchangeMultiplier, DECIMAL_PRECISION)

  if (lt(precisionAdjust, '1')) {
    const fPrecisionAdject = parseFloat(precisionAdjust)
    let order = 2 + Math.floor(Math.log(fPrecisionAdject) / Math.LN10 - 0.000000001) // because float math sucks like that
    order = Math.abs(order)
    if (order > 0) {
      return order
    }
  }
  return 0
}

export type PrecisionAdjustParams = {
  exchangeSecondaryToPrimaryRatio: string,
  secondaryExchangeMultiplier: string,
  primaryExchangeMultiplier: string
}
