// @flow
import borderColors from '../theme/variables/css3Colors'
import BS from 'biggystring'

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

export const convertNativeToDenomination = (nativeToDenominationRatio: string) => {
  return (nativeAmount: string): string => {
    return BS.divF(nativeAmount, nativeToDenominationRatio)
  }
}

export const convertDenominationToNative = (nativeToDenominationRatio: string) => {
  return (displayAmount: number): number => {
    return BS.mulF(displayAmount, nativeToDenominationRatio)
  }
}
