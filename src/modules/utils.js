import borderColors from '../theme/variables/css3Colors'
import { divf, mulf } from 'biggystring'

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

export const getFiatFromCrypto = (crypto, fiatPerCrypto) => {
  const fiatFromCrypto = (crypto * fiatPerCrypto)

  return fiatFromCrypto
}

export const getCryptoFromFiat = (fiat, fiatPerCrypto) => {
  const cryptoFromFiat = (fiat / fiatPerCrypto)

  return parseFloat(cryptoFromFiat.toFixed(5))
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

// Used to convert outputs form core to amounts ready for display
export const convertNativeToDenomination = (nativeToDenominationRatio: string) => {
  return (nativeAmount: string): number => {
    return divf(nativeAmount, nativeToDenominationRatio)
  }
}

// Used to convert amounts from display to core inputs
export const convertDenominationToNative = (nativeToDenominationRatio: string) => {
  return (denominationAmount: number): number => {
    return mulf(denominationAmount, nativeToDenominationRatio)
  }
}

// Used to convert exchange output to amounts ready for display
export const convertBaseToDenomination = (denominationToBaseRatio: string) => {
  return (baseAmount: string): string => {
    return mulf(baseAmount, denominationToBaseRatio)
  }
}

// Used to convert amounts from display to exchange inputs
export const convertDenominationToBase = (denominationToBaseRatio: string) => {
  return (denominationAmount: string): number => {
    return divf(denominationAmount, denominationToBaseRatio)
  }
}

// Used to get the ratio used for converting a denominationAmount into a
// baseAmount when using the currency exchange
export const deriveDenominationToBaseRatio = (targetNativeToDenominationRatio: string) => {
  return (sourceNativeToDenominationRatio: string): number => {
    return divf(sourceNativeToDenominationRatio, targetNativeToDenominationRatio)
  }
}
