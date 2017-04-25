const getFiatFromCrypto = (crypto, fiatPerCrypto) => {
  return crypto * fiatPerCrypto
}

const getCryptoFromFiat = (fiat, fiatPerCrypto) => {
  return fiat / fiatPerCrypto
}

const sanitizeInput = (input) => {
  const numbersUptoTwoPrecision = /\d*[.]?\d*/
  const sanitizedInput = input.toString().match(numbersUptoTwoPrecision)[0]

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

export {
  getFiatFromCrypto,
  getCryptoFromFiat,
  sanitizeInput,
  devStyle,
  logInfo,
  logError,
  logWarning
}
