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

const TYPED_ARRAYS = {
  '[object Float32Array]': true,
  '[object Float64Array]': true,
  '[object Int16Array]': true,
  '[object Int32Array]': true,
  '[object Int8Array]': true,
  '[object Uint16Array]': true,
  '[object Uint32Array]': true,
  '[object Uint8Array]': true,
  '[object Uint8ClampedArray]': true
}

/**
 * Compares two objects that are already known to have a common `[[Class]]`.
 */
function compareObjects (a, b, type) {
  // User-created objects:
  if (type === '[object Object]') {
    const proto = Object.getPrototypeOf(a)
    if (proto !== Object.getPrototypeOf(b)) return false

    const keys = Object.getOwnPropertyNames(a)
    if (keys.length !== Object.getOwnPropertyNames(b).length) return false

    // We know that both objects have the same number of properties,
    // so if every property in `a` has a matching property in `b`,
    // the objects must be identical, regardless of key order.
    for (const key of keys) {
      if (!b.hasOwnProperty(key) || !compare(a[key], b[key])) return false
    }
    return true
  }

  // Arrays:
  if (type === '[object Array]') {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; ++i) {
      if (!compare(a[i], b[i])) return false
    }
    return true
  }

  // Javascript dates:
  if (type === '[object Date]') {
    return a.getTime() === b.getTime()
  }

  // Typed arrays:
  if (TYPED_ARRAYS[type]) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  // We don't even try comparing anything else:
  return false
}

/**
 * Returns true if two Javascript values are equal in value.
 */
function compare (a, b) {
  if (a === b) return true

  // Fast path for primitives:
  if (typeof a !== 'object') return false
  if (typeof b !== 'object') return false

  // If these are objects, the internal `[[Class]]` properties must match:
  const type = Object.prototype.toString.call(a)
  if (type !== Object.prototype.toString.call(b)) return false

  return compareObjects(a, b, type)
}

export {
  getFiatFromCrypto,
  getCryptoFromFiat,
  sanitizeInput,
  devStyle,
  logInfo,
  logError,
  logWarning,
  border,
  compare
}
