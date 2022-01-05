// @flow

import URL from 'url-parse'

import ENV from '../../env.json'

/*
 * All Edge deep-linking features are available through the `edge://`
 * protocol. This protocol comes in three flavors, which are fully equivalent:
 *
 *   - edge://<type>/...
 *   - airbitz://<type>/...
 *   - https://deep.edge.app/<type>/...
 *
 * The `edge://` protocol supports the following link types:
 *
 *   - edge: Edge login
 *   - pay: Payment request
 *   - plugin: GUI plugin deep link
 *   - promotion: Activate a promotion code
 *   - recovery: Password recovery
 *   - swap: Crypto-to-crypto swap
 *   - x-callback-url: Address request
 *
 * The `edge://` protocol is the preferred way to link into the application,
 * but Edge also supports some feature-specific https domains:
 *
 *   - https://dl.edge.app/... = edge://promotion/...
 *   - https://dl.edge.app/?af=... = edge://promotion/...
 *   - https://recovery.edgesecure.co/... = edge://recovery/...
 *
 * We also support some legacy prefixes (but don't use these):
 *
 *   - https://www.edge.app/edgelogin?address=... = edge://edge/...
 *   - edge-ret://plugins/simplex/... = edge://plugin/simplex/...
 *   - edge-ret://x-callback-url/... = edge://x-callback-url/...
 *   - airbitz-ret://x-callback-url/... = edge://x-callback-url/...
 *
 * Besides the edge:// protocol, there are also various coin-specific URI
 * protocols like `bitcoin:`, which we just pass through as "other".
 */

export type AztecoLink = {
  type: 'azteco',
  uri: string
}

export type EdgeLoginLink = {
  type: 'edgeLogin',
  lobbyId: string
}

export type PasswordRecoveryLink = {
  type: 'passwordRecovery',
  passwordRecoveryKey: string
}

export type PluginLink = {
  type: 'plugin',
  pluginId: string,
  path: string,
  query: { [key: string]: string | null }
}

export type PromotionLink = {
  type: 'promotion',
  installerId?: string
}

export type ReturnAddressLink = {
  type: 'returnAddress',
  currencyName: string,
  sourceName?: string,
  successUri?: string
}

export type SwapLink = {
  type: 'swap'
  // We may eventually add query parameters to pre-populate currencies.
}

export type DeepLink =
  | AztecoLink
  | EdgeLoginLink
  | PasswordRecoveryLink
  | PluginLink
  | PromotionLink
  | ReturnAddressLink
  | SwapLink
  | {
      type: 'other',
      protocol: string, // Without the ':'
      uri: string
    }

/**
 * Parse a link into the app, identifying special
 * features that Edge knows how to handle.
 */
export function parseDeepLink(uri: string, opts: { aztecoApiKey?: string } = {}): DeepLink {
  const { aztecoApiKey = ENV.AZTECO_API_KEY } = opts

  // Normalize some legacy cases:
  for (const prefix of prefixes) {
    const [from, to] = prefix
    if (uri.indexOf(from) === 0) uri = uri.replace(from, to)
  }

  const url = new URL(uri, true)

  // Handle dl.edge.app links:
  if ((url.protocol === 'https:' || url.protocol === 'http:') && url.host === 'dl.edge.app') {
    return parseDownloadLink(url)
  }

  // Handle the edge:// protocol:
  if (url.protocol === 'edge:') {
    return parseEdgeProtocol(url)
  }

  // Handle address requests:
  if (/^[a-z]+-ret:$/.test(url.protocol)) {
    // Extract the coin name from the protocol:
    const coin = url.protocol.slice(0, url.protocol.indexOf('-ret:'))
    return parseReturnAddress(url, coin)
  }

  // Handle Azte.co URLs
  if (url.hostname === 'azte.co' && aztecoApiKey != null) {
    const queryMap = { c1: 'CODE_1', c2: 'CODE_2', c3: 'CODE_3', c4: 'CODE_4' }
    const query = Object.keys(url.query)
      .map(key => `${encodeURIComponent(queryMap[key] ? queryMap[key] : key)}=${encodeURIComponent(url.query[key])}`)
      .join('&')
    const aztecoLink = `${url.protocol}//${url.hostname}/partners/${aztecoApiKey}?${query}&ADDRESS=`
    return {
      type: 'azteco',
      uri: aztecoLink
    }
  }

  // Assume anything else is a coin link of some kind:
  const protocol = url.protocol.replace(/:$/, '')
  return { type: 'other', protocol, uri }
}

/**
 * Parse an `edge://` link of some kind.
 */
function parseEdgeProtocol(url: URL): DeepLink {
  const [, ...pathParts] = url.pathname.split('/')

  switch (url.host) {
    case 'edge': {
      const [lobbyId] = pathParts
      return { type: 'edgeLogin', lobbyId }
    }

    case 'pay': {
      const [protocol = '', ...deepPath] = pathParts
      const path = deepPath.join('/')
      const queryString = Object.keys(url.query)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(url.query[key])}`)
        .join('&')

      let uri = `${protocol}:${path}`
      if (queryString.length > 0) uri += `?${queryString}`
      return { type: 'other', uri, protocol }
    }

    case 'plugin': {
      const [pluginId = '', ...deepPath] = pathParts
      const path = deepPath.length !== 0 ? '/' + deepPath.join('/') : ''
      return { type: 'plugin', pluginId, path, query: url.query }
    }

    case 'promotion': {
      const [installerId] = pathParts
      return { type: 'promotion', installerId }
    }

    case 'recovery': {
      const { token = '' } = url.query
      return { type: 'passwordRecovery', passwordRecoveryKey: token }
    }

    case 'swap': {
      return { type: 'swap' }
    }

    case 'x-callback-url': {
      const currencyNameMatch = /^\/request-([a-z]+)-address/.exec(url.pathname)
      if (currencyNameMatch == null) {
        throw new SyntaxError('No request-address field')
      }
      return parseReturnAddress(url, currencyNameMatch[1])
    }
  }

  throw new SyntaxError('Unknown deep link format')
}

function parseDownloadLink(url: URL): PromotionLink {
  if (url.query.af != null) {
    return { type: 'promotion', installerId: url.query.af }
  }
  const [, installerId = ''] = url.pathname.split('/')
  return { type: 'promotion', installerId }
}

/**
 * Handles requests for a payment address, like
 * `edge://x-callback-url/request-litecoin-address` or
 * `litecoin-ret://x-callback-url/request-address`
 */
function parseReturnAddress(url: URL, currencyName: string): DeepLink {
  const sourceName = url.query['x-source']
  const successUri = url.query['x-success']
  return { type: 'returnAddress', currencyName, sourceName, successUri }
}

const prefixes: Array<[string, string]> = [
  // Alternative HTTPS links:
  ['https://recovery.edgesecure.co', 'edge://recovery'],

  // Legacy links:
  ['https://www.edge.app/edgelogin?address=', 'edge://edge/'],
  ['edge-ret://plugins/simplex/', 'edge://plugin/simplex/'],
  ['edge-ret://x-callback-url/', 'edge://x-callback-url/'],
  ['airbitz-ret://x-callback-url/', 'edge://x-callback-url/'],

  // Alternative schemes:
  ['https://deep.edge.app/', 'edge://'],
  ['airbitz://', 'edge://']
]
