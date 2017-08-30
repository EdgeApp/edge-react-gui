import borderColors from '../theme/variables/css3Colors'
import { divf, mulf } from 'biggystring'
import getSymbolFromCurrency from 'currency-symbol-map'

export const cutOffText = (str, lng) => {
  if (str.length >= lng) {
    return str.slice(0, lng) + '...'
  } else {
    return str
  }
}

export const findDenominationSymbol = (denoms, value) => {
  console.log('in findDenominationSymbol, denoms is: ', denoms, ' , and value is : ', value)
  for (const v of denoms) {
    if (v.name === value) {
      return v.symbol
    }
  }
}

export const getWalletDefaultDenomProps = (wallet, settingsState) => {
  console.log('in getWalletDefaultDenomProps, wallet is: ', wallet, ' , and settingsState is: ', settingsState)
  let allWalletDenoms = wallet.allDenominations
  let walletCurrencyCode = wallet.currencyCode
  let currencySettings = settingsState[walletCurrencyCode] // includes 'denomination', currencyName, and currencyCode
  let denomProperties = allWalletDenoms[walletCurrencyCode][currencySettings.denomination] // includes name, multiplier, and symbol
  console.log('in getWalletDefaultDenomProps, denomProperties is: ', denomProperties)
  return denomProperties
}

export const getFiatSymbol = (code) => {
  return getSymbolFromCurrency(code)
}

export const sanitizeInput = (input) => {
  const numbers = /\d*[.]?\d*/
  const sanitizedInput = input.toString().match(numbers)[0]

  return sanitizedInput
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

export const border = (color: string) => {
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

// Used to limit the decimals of a displayAmount
export const truncateDecimals = (input: string, precision: number): string => {
  input = (input === '') ? '0' : input
  if (!input.includes('.')) { return input }
  const [integers, decimals] = input.split('.')
  return `${integers}.${decimals.slice(0, precision)}`
}

export const formatNumber = (input: string): string => {
  return input === '.' ? '0.' : input
}

// Used to convert outputs form core to amounts ready for display
export const convertNativeToDisplay = (nativeToDisplayRatio: string) => {
  return (nativeAmount: string): string => {
    return divf(nativeAmount, nativeToDisplayRatio).toString()
  }
}

// Used to convert amounts from display to core inputs
export const convertDisplayToNative = (nativeToDisplayRatio: string) => {
  return (displayAmount: string): string => {
    if (!displayAmount) return ''
    return mulf(displayAmount, nativeToDisplayRatio)
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

export const absoluteValue = (input: string): string => {
  return input.replace('-', '')
}

export const getNewArrayWithoutItem = (list, targetItem) => {
  return list.filter(item => {
    return item !== targetItem
  })
}

export const getNewArrayWithItem = (list, item) => {
  if (!list.includes(item)) {
    return [...list, item]
  }
  return list
}
