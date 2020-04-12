// @flow

import { bns } from 'biggystring'
import {
  type EdgeCurrencyInfo,
  type EdgeEncodeUri,
  type EdgeParsedUri
} from 'edge-core-js/types'
import { serialize } from 'uri-js'
import parse from 'url-parse'

import {
  dirtyAddress,
  sanitizeAddress,
  toNewFormat,
  validAddress
} from '../utils/addressFormat/addressFormatIndex.js'
import { verifyUriProtocol, verifyWIF } from '../utils/coinUtils.js'

// import bcoin from 'bcoin'

const parsePathname = (pathname: string, network: string) => {
  // Check if the pathname type is a wif
  try {
    verifyWIF(pathname, network)
    return { privateKeys: [pathname] }
  } catch (e) {}
  // If the pathname is non of the above, then assume it's an address and check for validity
  const parsedAddress = {}
  let address = pathname
  let legacyAddress = ''
  address = dirtyAddress(address, network)
  if (validAddress(address, network)) {
    parsedAddress.publicAddress = address
  } else {
    address = sanitizeAddress(address, network)
    legacyAddress = address
    address = toNewFormat(address, network)
    if (!validAddress(address, network)) {
      throw new Error('InvalidPublicAddressError')
    }
    parsedAddress.publicAddress = address
    parsedAddress.legacyAddress = legacyAddress
  }
  return parsedAddress
}

export const parseUri = (
  uri: string,
  network: string,
  { pluginName, currencyCode, denominations }: EdgeCurrencyInfo
): EdgeParsedUri => {
  pluginName = pluginName.toLowerCase()
  const uriObj = parse(uri, {}, true)
  const { protocol, pathname, query } = uriObj
  // If the currency URI belongs to the wrong network then error
  if (!verifyUriProtocol(protocol, network, pluginName)) {
    throw new Error('InvalidUriError')
  }
  // Get all posible query params
  const { label, message, amount, r, category } = query
  // If we don't have a pathname or a paymentProtocolURL uri then we bail
  if (!pathname && !r) throw new Error('InvalidUriError')
  // Create the returned object
  const parsedUri = {}
  // Parse the pathname and add it to the result object
  if (pathname) {
    // Test if the currency code
    const parsedPath = parsePathname(pathname, network)
    if (!parsedPath) throw new Error('InvalidUriError')
    Object.assign(parsedUri, parsedPath)
  }
  // Assign the query params to the parsedUri object
  const metadata = {}
  if (label) Object.assign(metadata, { name: label })
  if (message) Object.assign(metadata, { notes: message })
  if (r) parsedUri.paymentProtocolURL = r
  if (category) Object.assign(metadata, { category: category })
  Object.assign(parsedUri, { metadata })
  // Get amount in native denomination if exists
  if (amount && typeof amount === 'string') {
    const denomination = denominations.find(e => e.name === currencyCode)
    if (denomination) {
      const { multiplier = '1' } = denomination
      const t = bns.mul(amount, multiplier.toString())
      Object.assign(parsedUri, {
        currencyCode,
        nativeAmount: bns.toFixed(t, 0, 0)
      })
    }
  }
  return parsedUri
}

export const encodeUri = (
  obj: EdgeEncodeUri,
  network: string,
  { pluginName, currencyCode, denominations }: EdgeCurrencyInfo
): string => {
  const { legacyAddress, publicAddress } = obj
  let address = publicAddress
  if (
    legacyAddress &&
    validAddress(toNewFormat(legacyAddress, network), network)
  ) {
    address = legacyAddress
  } else if (publicAddress && validAddress(publicAddress, network)) {
    address = dirtyAddress(publicAddress, network)
  } else {
    throw new Error('InvalidPublicAddressError')
  }
  // $FlowFixMe
  if (!obj.nativeAmount && !obj.metadata) return address
  // $FlowFixMe
  const metadata = obj.metadata || {}
  const nativeAmount = obj.nativeAmount || ''
  let queryString = ''
  if (nativeAmount) {
    // $FlowFixMe
    if (typeof obj.currencyCode === 'string') currencyCode = obj.currencyCode
    const denomination: any = denominations.find(e => e.name === currencyCode)
    const multiplier: string = denomination.multiplier.toString()
    const amount = bns.div(nativeAmount, multiplier, 8)
    queryString += 'amount=' + amount.toString() + '&'
  }
  if (typeof metadata === 'object') {
    if (typeof metadata.name === 'string') {
      queryString += `label=${metadata.name}&`
    }
    if (typeof metadata.notes === 'string') {
      queryString += `message=${metadata.notes}&`
    }
  }
  queryString = queryString.substr(0, queryString.length - 1)

  return serialize({
    scheme: pluginName.toLowerCase(),
    path: sanitizeAddress(address, network),
    query: queryString
  })
}
