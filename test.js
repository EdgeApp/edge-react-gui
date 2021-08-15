const { div, eq, gt, add } = require('biggystring')
const Big = require('big.js')

const DECIMAL_PRECISION = 18

// Used to limit the decimals of a displayAmount
// TODO every function that calls this function needs to be flowed
const truncateDecimals = (input, precision, allowBlank = false) => {
  if (input === '') {
    if (allowBlank) {
      input = ''
    } else {
      input = '0'
    }
  }
  if (!input.includes('.')) {
    return input
  }
  const [integers, decimals] = input.split('.')
  return precision > 0 ? `${integers}.${decimals.slice(0, precision)}` : integers
}

// Counts zeros after decimal place in number. '0.00036' => 3
const zerosAfterDecimal = input => {
  if (!input.includes('.')) return 0
  const decimals = input.split('.')[1]
  let numZeros = 0
  for (let i = 0; i <= decimals.length; i++) {
    if (eq(decimals[i], '0')) {
      numZeros++
    } else {
      break
    }
  }
  return numZeros
}

// Adds 1 to the least significant digit of a number. '12.00256' => '12.00257'
const roundUpToLeastSignificant = input => {
  if (!input.includes('.')) return input
  const precision = input.split('.')[1].length
  const oneExtra = `0.${'1'.padStart(precision, '0')}`
  return add(input, oneExtra)
}

const roundedFee = (nativeAmount, decimalPlacesBeyondLeadingZeros, multiplier) => {
  if (nativeAmount === '') return nativeAmount
  const displayAmount = div(nativeAmount, multiplier, DECIMAL_PRECISION)
  const precision = zerosAfterDecimal(displayAmount) + decimalPlacesBeyondLeadingZeros
  const truncatedAmount = truncateDecimals(displayAmount, precision)
  if (gt(displayAmount, truncatedAmount)) return `${roundUpToLeastSignificant(truncatedAmount)} `
  return `${truncatedAmount} `
}

const zerosAfterDecimal2 = input => input?.match(/(\.0*)/)?.[0].slice(1).length ?? 0

const roundedFee2 = (number, decimalPlacesBeyondLeadingZeros, divider) => {
  try {
    const bigNum = new Big(number).div(divider)
    const zeros = zerosAfterDecimal2(bigNum.toFixed())
    const roundNum = bigNum.round(decimalPlacesBeyondLeadingZeros + zeros, Big.roundUp)
    return `${roundNum.toFixed()} `
  } catch (e) {
    return ''
  }
}

for (let i = 0; i < 10; i++) {
  const a = roundedFee('', i, '1000000')
  const b = roundedFee2('', i, '1000000')
  if (a !== b) {
    throw new Error(`Not the same 1 ${i}`)
  }
  const c = roundedFee('0.00000000321', i, '1000000')
  const d = roundedFee2('0.00000000321', i, '1000000')
  if (c !== d) {
    throw new Error(`Not the same 2 ${i}`)
  }
  const e = roundedFee('0.00000000000000321', i, '1')
  const f = roundedFee2('0.00000000000000321', i, '1')
  if (e !== f) {
    throw new Error(`Not the same 3 ${i}`)
  }
  const g = roundedFee('0.00000000321', i, '1')
  const h = roundedFee2('0.00000000321', i, '1')
  if (g !== h) {
    throw new Error(`Not the same 4 ${i}`)
  }
  const j = roundedFee('0.00000000000000321', i, '1000000')
  const k = roundedFee2('0.00000000000000321', i, '1000000')
  if (j !== k) {
    throw new Error(`Not the same 5 ${i}`)
  }
  const j2 = roundedFee('1.00321', i, '1')
  const k2 = roundedFee2('1.00321', i, '1')
  if (j2 !== k2) {
    throw new Error(`Not the same 6 ${i}`)
  }
}

console.log(zerosAfterDecimal('0.000000000001') === zerosAfterDecimal2('0.000000000001'))
console.log(zerosAfterDecimal('01.000000000001') === zerosAfterDecimal2('01.000000000001'))
console.log(zerosAfterDecimal('01.100000000001') === zerosAfterDecimal2('01.100000000001'))
console.log(zerosAfterDecimal('0100.000010000001') === zerosAfterDecimal2('0100.000010000001'))
console.log(zerosAfterDecimal('0100') === zerosAfterDecimal2('0100'))
console.log(zerosAfterDecimal('0000') === zerosAfterDecimal2('0000'))
console.log(zerosAfterDecimal('0') === zerosAfterDecimal2('0'))
console.log(zerosAfterDecimal('') === zerosAfterDecimal2(''))

console.time('zerosAfterDecimal')
for (let i = 0; i < 10000; i++) {
  zerosAfterDecimal('0.000000000001')
  zerosAfterDecimal('01.000000000001')
  zerosAfterDecimal('01.100000000001')
  zerosAfterDecimal('0100.000010000001')
  zerosAfterDecimal('0100')
  zerosAfterDecimal('0000')
  zerosAfterDecimal('0')
  zerosAfterDecimal('')
}
console.timeEnd('zerosAfterDecimal')

console.time('zerosAfterDecimal2')
for (let i = 0; i < 10000; i++) {
  zerosAfterDecimal2('0.000000000001')
  zerosAfterDecimal2('01.000000000001')
  zerosAfterDecimal2('01.100000000001')
  zerosAfterDecimal2('0100.000010000001')
  zerosAfterDecimal2('0100')
  zerosAfterDecimal2('0000')
  zerosAfterDecimal2('0')
  zerosAfterDecimal2('')
}
console.timeEnd('zerosAfterDecimal2')

console.time('roundedFee')
for (let i = 0; i < 10000; i++) {
  roundedFee('', 2, '1000000')
  roundedFee('0.00000000321', 2, '1000000')
  roundedFee('0.00000000000000321', 2, '1')
  roundedFee('0.00000000321', 2, '1')
  roundedFee('0.00000000000000321', 2, '1000000')
  roundedFee('1.00321', 2, '1')
}
console.timeEnd('roundedFee')

console.time('roundedFee2')
for (let i = 0; i < 10000; i++) {
  roundedFee2('', 2, '1000000')
  roundedFee2('0.00000000321', 2, '1000000')
  roundedFee2('0.00000000000000321', 2, '1')
  roundedFee2('0.00000000321', 2, '1')
  roundedFee2('0.00000000000000321', 2, '1000000')
  roundedFee2('1.00321', 2, '1')
}
console.timeEnd('roundedFee2')

console.log(roundedFee('1.12312000000000000321', 2, '1'))
console.log(roundedFee2('1.12312000000000000321', 2, '1'))
