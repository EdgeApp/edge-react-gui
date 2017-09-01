// @flow
import borderColors from '../theme/variables/css3Colors'
import { divf, mulf, gt } from 'biggystring'
import getSymbolFromCurrency from 'currency-symbol-map'
import { AbcDenomination } from 'airbitz-core-js'

export const cutOffText = (str: string, lng: number) => {
  if (str.length >= lng) {
    return str.slice(0, lng) + '...'
  } else {
    return str
  }
}

export const findDenominationSymbol = (denoms: Array<AbcDenomination>, value: string) => {
  console.log('in findDenominationSymbol, denoms is: ', denoms, ' , and value is : ', value)
  for (const v of denoms) {
    if (v.name === value) {
      return v.symbol
    }
  }
}

export const getFiatSymbol = (code: string) => {
  return getSymbolFromCurrency(code)
}

export const limitFiatDecimals = (num: number) => {
  console.log('num: ', num)
  let inputString = num.toString()
  let periodPosition = inputString.indexOf('.')
  console.log('periodPosition: ', periodPosition)
  let first
  let second
  if (periodPosition > -1) {
    first = inputString.split('.')[0]
    console.log('first: ', first)
    second = inputString.split('.')[1]
    console.log('second: ', second)
    if (second.length > 2) {
      return first + '.' + second.slice(0, 2)
    } else {
      return first + '.' + second
    }
  } else {
    return num
  }
}

export const devStyle = {
  borderColor: 'red',
  borderWidth: 1,
  backgroundColor: 'yellow'
}

export const logInfo = (msg: string) => {
  console.log('%c ' + msg, 'background: grey; font-weight: bold; display: block;')
}

export const logWarning = (msg: string) => {
  console.log('%c ' + msg, 'background: yellow; font-weight: bold; display: block;')
}

export const logError = (msg: string) => {
  console.log('%c ' + msg, 'background: red; font-weight: bold; display: block;')
}

export const border = (color: ?string) => {
  let borderColor = color || getRandomColor()
  return {
    borderColor: borderColor,
    borderWidth: 0
  }
}

export const getRandomColor = () => {
  return borderColors[Math.floor(Math.random() * borderColors.length)]
}

// Used to reject non-numeric (expect '.') values in the FlipInput
export const isValidInput = (input: string): boolean => {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Unary_plus_()
  return !isNaN(+input) || input === '.'
}

export const formatNumber = (input: string): string => {
  return input === '.' ? '0.' : input
}

// Used to convert outputs from core into other denominations (exchangeDenomination, displayDenomination)
export const convertNativeToDenomination = (nativeToTargetRatio: string) => {
  return (nativeAmount: string): string => {
    return divf(nativeAmount, nativeToTargetRatio).toString()
  }
}

// Alias for convertNativeToDenomination
// Used to convert outputs from core to amounts ready for display
export const convertNativeToDisplay = convertNativeToDenomination
// Alias for convertNativeToDenomination
// Used to convert outputs from core to amounts ready for display
export const convertNativeToExchange = convertNativeToDenomination

// Used to convert amounts from display to core inputs
export const convertDisplayToNative = (nativeToDisplayRatio: string) => {
  return (displayAmount: string): string => {
    if (!displayAmount) return ''
    return mulf(parseFloat(displayAmount), nativeToDisplayRatio)
  }
}

// Used to convert exchange output to amounts ready for display
export const convertExchangeToDisplay = (displayToExchangeRatio: string) => {
  return (exchangeAmount: string): string => {
    return (parseFloat(exchangeAmount) * parseFloat(displayToExchangeRatio)).toString()
  }
}

// Used to convert amounts from display to exchange inputs
export const convertDisplayToExchange = (displayToExchangeRatio: string) => {
  return (displayAmount: string): string => {
    return (parseFloat(displayAmount) / parseFloat(displayToExchangeRatio)).toString()
  }
}

// Used to convert amounts in their respective exchange denominations
export const convertExchangeToExchange = (ratio: string) => {
  return (exchangeAmount: string): string => {
    return (parseFloat(exchangeAmount) * parseFloat(ratio)).toString()
  }
}

// Used to get the ratio used for converting a displayAmount into a
// exchangeAmount when using the currency exchange
export const deriveDisplayToExchangeRatio = (exchangeNativeToDisplayRatio: string) => {
  return (displayNativeToDisplayRatio: string): string => {
    return divf(exchangeNativeToDisplayRatio, displayNativeToDisplayRatio).toString()
  }
}

// Used to limit the decimals of a displayAmount
export const truncateDecimals = (input: string, precision: number): string => {
  if (!input.includes('.')) { return input }
  const [integers, decimals] = input.split('.')
  return `${integers}.${decimals.slice(0, precision)}`
}

export const absoluteValue = (input: string): string => {
  return input.replace('-', '')
}

export const getNewArrayWithoutItem = (array: Array<any>, targetItem: any) => {
  return array.filter(item => {
    return item !== targetItem
  })
}

export const getNewArrayWithItem = (array: Array<any>, item: any) => {
  if (!array.includes(item)) {
    return [...array, item]
  }
  return array
}

export const isGreaterThan = (comparedTo: string) => {
  // $FlowFixMe
  return (amountString: string): boolean => {
    return gt(amountString, comparedTo)
  }
}
