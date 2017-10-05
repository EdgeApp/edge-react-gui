// @flow
import borderColors from '../theme/variables/css3Colors'
import {divf, mulf, gt} from 'biggystring'
import getSymbolFromCurrency from 'currency-symbol-map'
import type {AbcDenomination} from 'airbitz-core-types'
import type {GuiDenomination} from '../types'

const currencySymbolMap = require('currency-symbol-map').currencySymbolMap

export const cutOffText = (str: string, lng: number) => {
  if (str.length >= lng) {
    return str.slice(0, lng) + '...'
  } else {
    return str
  }
}

export const findDenominationSymbol = (denoms: Array<AbcDenomination>, value: string) => {
  // console.log('in findDenominationSymbol, denoms is: ', denoms, ' , and value is : ', value)
  for (const v of denoms) {
    if (v.name === value) {
      return v.symbol
    }
  }
}

export const getWalletDefaultDenomProps = (wallet: Object, settingsState: Object): AbcDenomination => {
  // console.log('in getWalletDefaultDenomProps, wallet is: ', wallet, ' , and settingsState is: ', settingsState)
  let allWalletDenoms = wallet.allDenominations
  let walletCurrencyCode = wallet.currencyCode
  let currencySettings = settingsState[walletCurrencyCode] // includes 'denomination', currencyName, and currencyCode
  let denomProperties: AbcDenomination = allWalletDenoms[walletCurrencyCode][currencySettings.denomination] // includes name, multiplier, and symbol
  // console.log('in getWalletDefaultDenomProps, denomProperties is: ', denomProperties)
  return denomProperties
}

export const getFiatSymbol = (code: string) => {
  // console.log('inside utils.getFiatSymbol, code is: ', code)
  code = code.replace('iso:', '')
  return getSymbolFromCurrency(code)
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

export const getRandomColor = () => borderColors[Math.floor(Math.random() * borderColors.length)]

export const addFiatTwoDecimals = (input: string) => {
  // console.log('input is: ', input , ' , input.length is: ', input.length, ' , input.indexOf is: ' , input.indexOf('.'), ' , and input.includes() is: ', input.includes('.'))
  if (input.length - input.indexOf('.') === 1) {
    input = input + '0'
  } else if (!input.includes('.')) {
    input = input + '.00'
  }

  return input
}

// Used to reject non-numeric (expect '.') values in the FlipInput
export const isValidInput = (input: string): boolean =>
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Unary_plus_()
   !isNaN(+input) || input === '.'

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
  if (!input.includes('.')) { return input }
  const [integers, decimals] = input.split('.')
  return `${integers}.${decimals.slice(0, precision)}`
}

export const formatNumber = (input: string): string => {
  let out = input.replace(/^0+/,'')
  if (out.startsWith('.')) {
    out = '0' + out
  }
  return out
}

// Used to convert outputs from core into other denominations (exchangeDenomination, displayDenomination)
export const convertNativeToDenomination = (nativeToTargetRatio: string) =>
  (nativeAmount: string): string =>
    divf(nativeAmount, nativeToTargetRatio).toString()

// Alias for convertNativeToDenomination
// Used to convert outputs from core to amounts ready for display
export const convertNativeToDisplay = convertNativeToDenomination
// Alias for convertNativeToDenomination
// Used to convert outputs from core to amounts ready for display
export const convertNativeToExchange = convertNativeToDenomination

// Used to convert amounts from display to core inputs
export const convertDisplayToNative = (nativeToDisplayRatio: string) =>
  (displayAmount: string): string =>
    !displayAmount ? '' : mulf(parseFloat(displayAmount), nativeToDisplayRatio)

// Used to convert exchange output to amounts ready for display
export const convertExchangeToDisplay = (displayToExchangeRatio: string) =>
  (exchangeAmount: string): string =>
    (parseFloat(exchangeAmount) * parseFloat(displayToExchangeRatio)).toString()

// Used to convert amounts from display to exchange inputs
export const convertDisplayToExchange = (displayToExchangeRatio: string) =>
  (displayAmount: string): string =>
    (parseFloat(displayAmount) / parseFloat(displayToExchangeRatio)).toString()

// Used to convert amounts in their respective exchange denominations
export const convertExchangeToExchange = (ratio: string) =>
  (exchangeAmount: string): string =>
    (parseFloat(exchangeAmount) * parseFloat(ratio)).toString()

// Used to get the ratio used for converting a displayAmount into a
// exchangeAmount when using the currency exchange
export const deriveDisplayToExchangeRatio = (exchangeNativeToDisplayRatio: string) =>
  (displayNativeToDisplayRatio: string): string =>
    divf(exchangeNativeToDisplayRatio, displayNativeToDisplayRatio).toString()

export const absoluteValue = (input: string): string => input.replace('-', '')

export const getNewArrayWithoutItem = (array: Array<any>, targetItem: any) =>
  array.filter((item) => item !== targetItem)

export const getNewArrayWithItem = (array: Array<any>, item: any) =>
  !array.includes(item) ? [...array, item] : array

export const isGreaterThan = (comparedTo: string) =>
   (amountString: string): boolean => gt(amountString, comparedTo)

const restrictedCurrencyCodes = [
  'BTC'
]

export function getDenomFromIsoCode (currencyCode: string): GuiDenomination {
  if (restrictedCurrencyCodes.findIndex((item) => item === currencyCode) !== -1) {
    return {
      name: '',
      currencyCode: '',
      symbol: '',
      precision: 0,
      multiplier: '0'
    }
  }
  const symbol = getSymbolFromCurrency(currencyCode)
  const denom: GuiDenomination = {
    name: currencyCode,
    currencyCode,
    symbol,
    precision: 2,
    multiplier: '100'
  }
  return denom
}

export function getAllDenomsOfIsoCurrencies (): Array<GuiDenomination> {
  // Convert map to an array
  const denomArray = []

  for (const currencyCode in currencySymbolMap) {
    if (currencySymbolMap.hasOwnProperty(currencyCode)) {
      const item = getDenomFromIsoCode(currencyCode)
      if (item.name.length) {
        denomArray.push(item)
      }
    }
  }
  return denomArray
}

export const getSupportedFiats = (): Array<{label: string, value: string}> => {
  const currencySymbolsFromCurrencyCode = currencySymbolMap
  const entries = Object.entries(currencySymbolsFromCurrencyCode)
  const objectFromArrayPair = (entry) => {
    const entry1 = typeof entry[1] === 'string'
      ? entry[1]
      : ''

    return {
      label: `${entry[0]} - ${entry1}`,
      value: entry[0]
    }
  }

  const supportedFiats = entries.map(objectFromArrayPair)
  return supportedFiats
}

type ExchangeData = {
  secondaryDisplayAmount: string,
  cryptoCurrencyCode: string,
  fiatSymbol: string,
  fiatExchangeAmount: string,
  fiatCurrencyCode: string
}

export const isCompleteExchangeData = (exchangeData: ExchangeData) =>
  !!exchangeData.secondaryDisplayAmount
    && !!exchangeData.cryptoCurrencyCode
    && !!exchangeData.fiatSymbol
    && !!exchangeData.fiatExchangeAmount
    && !!exchangeData.fiatCurrencyCode

export const unspacedLowercase = (input: string) => {
  let newInput = input.replace(' ', '').toLowerCase()
  return newInput
}