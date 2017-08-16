import borderColors from '../theme/variables/css3Colors'
import getSymbolFromCurrency from 'currency-symbol-map'

export const cutOffText = (str, lng) => {
  if (str.length >= lng) {
    return str.slice(0, lng) + '...'
  } else {
    return str
  }
}

/* export const cuttMiddleText = (str, lng1, lng2)=> {
  // for later insertion
} */

export const findDenominationSymbol = (denoms, value) => {
  console.log('in findDenominationSymbol, denoms is: ', denoms, ' , and value is : ', value)
  for (const v of denoms) {
    if (v.name === value) {
      return v.symbol
    }
  }
}

export const getFiatSymbol = (code) => {
  return getSymbolFromCurrency(code)
}

const getFiatFromCrypto = (crypto, fiatPerCrypto) => {
  const fiatFromCrypto = (crypto * fiatPerCrypto)

  return fiatFromCrypto
}

const getCryptoFromFiat = (fiat, fiatPerCrypto) => {
  const cryptoFromFiat = (fiat / fiatPerCrypto)

  return parseFloat(cryptoFromFiat.toFixed(5))
}

const sanitizeInput = (input) => {
  const numbers = /\d*[.]?\d*/
  const sanitizedInput = input.toString().match(numbers)[0]

  return sanitizedInput
}

export const limitFiatDecimals = (num) => {
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

const devStyle = {
  borderColor: 'red',
  borderWidth: 1,
  backgroundColor: 'yellow'
}

const logInfo = (msg) => {
  console.log('%c ' + msg, 'background: grey; font-weight: bold; display: block;')
}

const logWarning = (msg) => {
  console.log('%c ' + msg, 'background: yellow; font-weight: bold; display: block;')
}

const logError = (msg) => {
  console.log('%c ' + msg, 'background: red; font-weight: bold; display: block;')
}

const border = (color) => {
  let borderColor = color || getRandomColor()
  return {
    borderColor: borderColor,
    borderWidth: 1
  }
}

const getRandomColor = () => {
  return borderColors[Math.floor(Math.random() * borderColors.length)]
}

export {
  getFiatFromCrypto,
  getCryptoFromFiat,
  sanitizeInput,
  devStyle,
  logInfo,
  logError,
  logWarning,
  border
}
