const getFiatFromCrypto = (crypto, fiatPerCrypto) => {
  const fiatFromCrypto = (crypto * fiatPerCrypto)

  return fiatFromCrypto
}

const getCryptoFromFiat = (fiat, fiatPerCrypto) => {
  const cryptoFromFiat = (fiat / fiatPerCrypto)

  return cryptoFromFiat
}

const sanitizeInput = (input) => {
  const numbers = /\d*[.]?\d*/
  const sanitizedInput = input.toString().match(numbers)[0]

  return sanitizedInput
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
    return {
      borderColor: color,
      borderWidth: 0
    }
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
