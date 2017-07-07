import borderColors from '../theme/variables/css3Colors'

export const cutOffText = (str, lng) => {
  if(str.length >= lng ) {
    return str.slice(0, lng) + '...'
  } else {
    return str
  }
}

/*export const cuttMiddleText = (str, lng1, lng2)=> {
  // for later insertion
}*/

export const findDenominationSymbol = (denoms, value) => {
  console.log('in findDenominationSymbol, denoms is: ' , denoms, ' , and value is : ', value)
  for(v of denoms) {
    if(v.name === value) {
      return v.symbol
    }
  }
}

export const formatAMPM = (date) => {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

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
  var randColor = borderColors[Math.floor(Math.random() * borderColors.length)]
  let borderColor = color ? color : randColor
  return {
    borderColor: borderColor,
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
