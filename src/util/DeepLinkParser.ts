import { asOptional } from 'cleaners'
import URL from 'url-parse'

import { guiPlugins } from '../constants/plugins/GuiPlugins'
import { ENV } from '../env'
import { asFiatDirection, asFiatPaymentType } from '../plugins/gui/fiatPluginTypes'
import { DeepLink, PromotionLink } from '../types/DeepLinkTypes'
import { parseQuery, stringifyQuery } from './WebUtils'

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

  const url = new URL(uri)
  const betterUrl = new URL(uri, true)

  if (url.protocol === 'dev:') {
    // @ts-expect-error
    return { type: 'dev', sceneName: url.pathname }
  }

  // Handle dl.edge.app links:
  if ((url.protocol === 'https:' || url.protocol === 'http:') && url.host === 'dl.edge.app') {
    return parseDownloadLink(url)
  }

  // Handle payment protocol links.
  // We always want to bypass the plugin, even if a scheme (i.e. bitcoin:) is
  // defined because it is valid for the user to accept any supported currency
  // besides the specific currency defined in the uri's scheme.
  // Even if a specific currency is found in the protocol, the payment protocol
  // does not care what currency the payment steps start with.
  if (betterUrl.query.r != null && betterUrl.query.r.includes('http')) {
    // If the URI started with 'bitcoin:', etc.
    uri = betterUrl.query.r
    return { type: 'paymentProto', uri }
  }

  // Handle the edge:// scheme:
  if (url.protocol === 'edge:') {
    return parseEdgeProtocol(url)
  }

  if (url.protocol === 'reqaddr:') {
    return parseRequestAddress(url)
  }

  // Handle the wallet connect:
  if (url.protocol === 'wc:') {
    return { type: 'walletConnect', uri }
  }

  // Handle Azte.co URLs
  if (url.hostname === 'azte.co' && aztecoApiKey != null) {
    const query = parseQuery(url.query)
    const cleanQuery: typeof query = {}
    for (const key of Object.keys(query)) {
      const cleanKey = /^c[0-9]$/.test(key) ? key.replace('c', 'CODE_') : key
      cleanQuery[cleanKey] = query[key]
    }
    const aztecoLink = `${url.protocol}//${url.hostname}/partners/${aztecoApiKey}${stringifyQuery(cleanQuery)}&ADDRESS=`
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
function parseEdgeProtocol(url: URL<string>): DeepLink {
  const [, ...pathParts] = url.pathname.split('/')

  switch (url.host) {
    case 'edge': {
      const [lobbyId] = pathParts
      return { type: 'edgeLogin', lobbyId }
    }

    case 'pay': {
      const [protocol = '', ...deepPath] = pathParts
      const path = deepPath.join('/')

      const uri = `${protocol}:${path}${url.query}`
      return { type: 'other', uri, protocol }
    }

    case 'plugin': {
      const [pluginId, ...deepPath] = pathParts

      // Is this a plugin we know about?
      const plugin = guiPlugins[pluginId]
      if (plugin?.nativePlugin == null) {
        return {
          type: 'plugin',
          pluginId,
          path: stringifyPath(deepPath),
          query: parseQuery(url.query)
        }
      }

      // New-style fiat plugins:
      const [direction, providerId, paymentType] = deepPath
      return {
        type: 'fiatPlugin',
        pluginId,
        direction: asOptional(asFiatDirection)(direction),
        providerId,
        paymentType: asOptional(asFiatPaymentType)(paymentType)
      }
    }

    case 'price-change': {
      const { body, pluginId } = parseQuery(url.query)
      if (body == null || pluginId == null) throw new SyntaxError('Missing body or pluginId')
      return { type: 'price-change', body, pluginId }
    }

    case 'promotion': {
      const [installerId] = pathParts
      return { type: 'promotion', installerId }
    }

    case 'recovery': {
      // The new & improved format stores the token as a fragment:
      if (url.hash != null && url.hash !== '') {
        return {
          type: 'passwordRecovery',
          passwordRecoveryKey: url.hash.replace(/^#/, '')
        }
      }
      // The old format puts the token in the query:
      const { token } = parseQuery(url.query)
      if (token == null) throw new SyntaxError('No recovery token')
      return { type: 'passwordRecovery', passwordRecoveryKey: token }
    }

    case 'swap': {
      return { type: 'swap' }
    }

    case 'wc': {
      const uriEncoded = url.query.replace(/.*uri=/, '')
      const uri = decodeURIComponent(uriEncoded)
      return { type: 'walletConnect', uri }
    }

    case 'reqaddr': {
      return parseRequestAddress(url)
    }

    case 'https': {
      if (url.href.includes('bitpay')) return { type: 'other', uri: 'https:' + url.pathname, protocol: 'bitpay' }
    }
  }

  throw new SyntaxError('Unknown deep link format')
}

function stringifyPath(path: string[]): string {
  return path.length === 0 ? '' : '/' + path.join('/')
}

function parseDownloadLink(url: URL<string>): PromotionLink {
  const { af } = parseQuery(url.query)
  if (af != null) {
    return { type: 'promotion', installerId: af }
  }
  const [, installerId = ''] = url.pathname.split('/')
  return { type: 'promotion', installerId }
}

/**
 * Parse a request for address link.
 */
function parseRequestAddress(url: URL<string>): DeepLink {
  const query = parseQuery(url.query)
  const codesString = query.codes ?? undefined

  const redir = query.redir != null ? decodeURI(query.redir) : undefined
  const post = query.post != null ? decodeURI(query.post) : undefined
  const payer = query.payer ?? undefined

  if (codesString == null) throw new SyntaxError('No currency codes found in request for address')

  // Split the asset codes by '-'
  const codes = codesString.split('-')

  // Split each asset code by '_'
  const assets = codes.map(codePair => {
    const splitCodes = codePair.split('_')
    const nativeCode = splitCodes[0].toUpperCase()
    const tokenCode = splitCodes.length > 1 ? splitCodes[1].toUpperCase() : nativeCode
    return { nativeCode, tokenCode }
  })

  return { type: 'requestAddress', assets, redir, post, payer }
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
  ['airbitz://', 'edge://'],
  ['reqaddr://', 'edge://reqaddr']
]
