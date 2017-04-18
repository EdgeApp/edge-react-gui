const getFiatFromCrypto = (crypto, fiatPerCrypto) => {
  return crypto * fiatPerCrypto
}

const getCryptoFromFiat = (fiat, fiatPerCrypto) => {
  return fiat / fiatPerCrypto
}

const sanitizeInput = (input) => {
  const numbersUptoTwoPrecision = /\d*[.]?\d*/
  const sanitizedInput = input.toString().match(numbersUptoTwoPrecision)

  console.log(Number(sanitizedInput))

  return Number(sanitizedInput)
}

const devStyle = {
  borderColor: 'red',
  borderWidth: 1,
  backgroundColor: 'yellow'
}

export {
  getFiatFromCrypto,
  getCryptoFromFiat,
  sanitizeInput,
  devStyle
}
