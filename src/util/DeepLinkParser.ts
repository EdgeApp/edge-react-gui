import { asOptional } from 'cleaners'
import type { EdgeTokenId } from 'edge-core-js'
import URL from 'url-parse'

import { guiPlugins } from '../constants/plugins/GuiPlugins'
import { ENV } from '../env'
import {
  asFiatDirection,
  asFiatPaymentType,
  type FiatPaymentType
} from '../plugins/gui/fiatPluginTypes'
import {
  asModalNames,
  type DeepLink,
  type PromotionLink
} from '../types/DeepLinkTypes'
import type { AppParamList } from '../types/routerTypes'
import type { UriQueryMap } from '../types/WebTypes'
import { parseQuery, stringifyQuery } from './WebUtils'

/**
 * Parse a link into the app, identifying special
 * features that Edge knows how to handle.
 */
export function parseDeepLink(
  uri: string,
  opts: { aztecoApiKey?: string } = {}
): DeepLink {
  const { aztecoApiKey = ENV.AZTECO_API_KEY } = opts

  // Extract an `af` affiliate installer id from `deep.edge.app` URLs before
  // the prefix normalization below strips the host. Matches the `dl.edge.app`
  // behavior and adds a wrapper when there is also an inner payload:
  const affiliateSplit = splitAffiliateLink(uri)
  if (affiliateSplit != null) {
    const { installerId, remainingUri } = affiliateSplit
    const inner = parseDeepLink(remainingUri, opts)
    if (inner.type === 'promotion' || inner.type === 'noop') {
      return { type: 'promotion', installerId }
    }
    return { type: 'affiliate', installerId, link: inner }
  }

  // Normalize some legacy cases:
  for (const prefix of prefixes) {
    const [from, to] = prefix
    if (uri.startsWith(from)) uri = uri.replace(from, to)
  }

  const url = new URL(uri)
  const betterUrl = new URL(uri, true)

  if (url.protocol === 'dev:') {
    return {
      type: 'scene',
      // @ts-expect-error We should run the URL through a whitelist,
      // to be sure the provided scene name even exists:
      sceneName: url.pathname.replace('/', ''),
      query: parseQuery(url.query)
    }
  }

  // Handle edge.app and dl.edge.app links:
  if (url.protocol === 'https:' || url.protocol === 'http:') {
    // Handle dl.edge.app links:
    if (url.host === 'dl.edge.app') {
      return parseDownloadLink(url)
    }

    // Handle edge.app links:
    if (url.host === 'edge.app') {
      return parseEdgeAppLink(url)
    }
  }

  // Handle payment protocol links.
  // We always want to bypass the plugin, even if a scheme (i.e. bitcoin:) is
  // defined because it is valid for the user to accept any supported currency
  // besides the specific currency defined in the uri's scheme.
  // Even if a specific currency is found in the protocol, the payment protocol
  // does not care what currency the payment steps start with.
  if (betterUrl.query.r?.includes('http') === true) {
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
    const aztecoLink = `${url.protocol}//${
      url.hostname
    }/partners/${aztecoApiKey}${stringifyQuery(cleanQuery)}&ADDRESS=`
    return {
      type: 'azteco',
      uri: aztecoLink
    }
  }

  // Validate ZIP-321 (`zcash:`) URIs before falling through to the generic
  // coin-link path. The plugin's parseUri handles single-recipient extraction,
  // but the spec also mandates rejecting unknown `req-*` params and we don't
  // yet implement the multi-recipient form.
  if (url.protocol === 'zcash:') {
    validateZip321Uri(betterUrl)
  }

  // Assume anything else is a coin link of some kind (with the exception of
  // deprecated currencies):
  const protocol = url.protocol.replace(/:$/, '')
  return { type: 'other', protocol, uri }
}

/**
 * Enforce the parts of ZIP-321 (https://zips.z.cash/zip-0321) that the zcash
 * plugin's parseUri does not enforce on its own:
 *
 * 1. Any query param starting with `req-` is required; unknown required params
 *    must cause the URI to be rejected.
 * 2. The multi-recipient form (`zcash:?address=...&address.1=...`) is not yet
 *    routed through the GUI's single-recipient send flow, so we reject it
 *    with a clear error instead of silently mis-parsing it.
 */
function validateZip321Uri(url: URL<Record<string, string | undefined>>): void {
  const query = url.query

  for (const key of Object.keys(query)) {
    // The spec only defines req-* as a marker for required params. Since no
    // req-* params are recognized today, the presence of any such key means
    // the URI must be rejected. Index suffixes (`req-foo.1`) are stripped for
    // a cleaner error message.
    if (key.startsWith('req-')) {
      throw new SyntaxError(
        `Unrecognized required ZIP-321 parameter: ${key.replace(/\.\d+$/, '')}`
      )
    }
  }

  // Multi-recipient form: either an indexed `address.N` param or a top-level
  // `address` param when no address is present in the path.
  const hasIndexedAddress = Object.keys(query).some(key =>
    /^address\.\d+$/.test(key)
  )
  const hasTopLevelAddress = query.address != null
  if (hasIndexedAddress || hasTopLevelAddress) {
    throw new SyntaxError(
      'Multi-recipient ZIP-321 payment requests are not supported'
    )
  }
}

/**
 * Parse an `edge://` link of some kind.
 */
function parseEdgeProtocol(url: URL<string>): DeepLink {
  const [, ...pathParts] = url.pathname.split('/')

  switch (url.host) {
    case 'buy':
    case 'sell': {
      const [providerId, paymentType] = pathParts
      return {
        type: 'rampCreate',
        direction: url.host === 'buy' ? 'buy' : 'sell',
        providerId:
          providerId == null || providerId === '' ? undefined : providerId,
        paymentType: parseOptionalPaymentType(paymentType)
      }
    }

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

    case 'fiatprovider': {
      const [directionString, providerId, ...deepPath] = pathParts
      const direction = asFiatDirection(directionString)

      return {
        type: 'fiatProvider',
        direction,
        path: stringifyPath(deepPath),
        providerId,
        query: parseQuery(url.query),
        uri: url.href
      }
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

    case 'promotion': {
      const [installerId] = pathParts
      return { type: 'promotion', installerId }
    }

    case 'ramp': {
      const [directionString, providerId, ...deepPath] = pathParts
      const direction = asFiatDirection(directionString)

      return {
        type: 'ramp',
        direction,
        path: stringifyPath(deepPath),
        providerId,
        query: parseQuery(url.query),
        uri: url.href
      }
    }

    case 'redirect': {
      // Provider ramp redirect (e.g. MoonPay "Send with Edge"). All ramp
      // redirect URLs now live on the claimed `deep.edge.app` host, which
      // normalizes to this `edge://` path. parseRedirectSection resolves each
      // section (payment -> pre-filled Send scene; terminal states and any
      // malformed payment link -> no-op) identically for the apex host below.
      const link = parseRedirectSection(pathParts[0], parseQuery(url.query))
      if (link != null) return link
      break
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

    case 'scene': {
      const sceneName = url.pathname.replace('/', '')
      return {
        type: 'scene',
        sceneName: sceneName as keyof AppParamList,
        query: parseQuery(url.query)
      }
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

    case 'modal': {
      const rawModalName = url.pathname.replace('/', '')
      try {
        return { type: 'modal', modalName: asModalNames(rawModalName) }
      } catch (e) {
        throw new SyntaxError(`Unknown modal name: ${rawModalName}`)
      }
    }

    case 'https': {
      if (url.href.includes('bitpay'))
        return {
          type: 'other',
          uri: 'https:' + url.pathname,
          protocol: 'bitpay'
        }
      break
    }

    case '': {
      // If we're a blank edge:// link, just do nothing since we
      // were probably just deep linked into the app.
      if (url.href === 'edge://' && url.pathname === '' && url.query === '') {
        return { type: 'noop' }
      }
    }
  }

  throw new SyntaxError('Unknown deep link format')
}

/**
 * Resolve a payment type from a `edge://buy` / `edge://sell` path segment,
 * dropping anything we do not recognize. These links are authored by partners
 * and marketing, so a stale or misspelled payment type must still open the
 * buy/sell flow (unpinned) instead of dead-ending on "Unknown deep link
 * format".
 */
function parseOptionalPaymentType(
  paymentType: string | undefined
): FiatPaymentType | undefined {
  if (paymentType == null || paymentType === '') return undefined
  try {
    return asFiatPaymentType(paymentType)
  } catch (error) {
    console.warn(`Ignoring unknown deep link payment type: ${paymentType}`)
    return undefined
  }
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
 * Parse an https://edge.app/ link
 */
function parseEdgeAppLink(url: URL<string>): DeepLink {
  const [, ...pathParts] = url.pathname.split('/')
  const firstPath = pathParts[0] ?? ''
  const query = parseQuery(url.query)

  // Handle rewards links
  if (firstPath === 'rewards') {
    // Extract data from query parameter
    const { data } = query

    if (data != null) {
      // Parse data in format{{REWARDS:ethereum:a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48}}
      const dataMatch = /{{([^:]+):([^:]+)(?::([^}]+))?}}/.exec(data)

      if (dataMatch != null) {
        const [, type, pluginId, tokenId = null] = dataMatch

        // Currently only handling REWARDS type
        if (type === 'REWARDS') {
          console.debug(
            `Rewards link detected with pluginId: ${pluginId}, tokenId: ${tokenId}`
          )

          return {
            type: 'rewards',
            pluginId,
            tokenId: tokenId as EdgeTokenId
          }
        }
      }
    }
  }

  // Handle provider ramp redirects (e.g. MoonPay "Send with Edge"), which
  // legacy orders may still point at the apex https://edge.app/redirect/...
  // Route them through the same parseRedirectSection as the `edge://` scheme so
  // both hosts stay in sync: a malformed apex payment link resolves to a no-op
  // instead of falling through to a browser-opened dead apex page.
  if (firstPath === 'redirect') {
    const link = parseRedirectSection(pathParts[1], query)
    if (link != null) return link
  }

  // No special handling supported. Open in browser.
  return {
    type: 'other',
    protocol: url.protocol.replace(/:$/, ''),
    uri: url.href
  }
}

/**
 * Resolve a provider ramp redirect `/redirect/<section>/`, shared by the
 * `edge://` scheme (parseEdgeProtocol) and the legacy apex `https://edge.app`
 * host (parseEdgeAppLink) so the two hosts can never drift. `payment` carries a
 * pending sell order's deposit details and opens the pre-filled Send scene; a
 * malformed or param-less payment link degrades to a no-op rather than
 * surfacing an "Unknown deep link format" error or opening a dead apex page.
 * The terminal states (`success`/`fail`/`cancel`) carry no payload, so an
 * externally-tapped link just opens the app via a no-op. Returns null for any
 * other section so the caller applies its own default (browser) handling.
 */
function parseRedirectSection(
  section: string | undefined,
  query: UriQueryMap
): DeepLink | null {
  if (section === 'payment') {
    return parsePaymentRedirect(query) ?? { type: 'noop' }
  }
  if (section === 'success' || section === 'fail' || section === 'cancel') {
    return { type: 'noop' }
  }
  return null
}

/**
 * Parse a provider sell-completion redirect such as MoonPay's "Send with Edge"
 * button, which sends the user to a `/redirect/payment/` URL carrying the
 * deposit details for a pending sell order. Returns null when the required
 * deposit parameters are missing so the caller can fall back to its default
 * handling (e.g. opening the link in a browser).
 */
function parsePaymentRedirect(query: UriQueryMap): DeepLink | null {
  // Treat a present-but-blank required param the same as an absent one: an empty
  // `depositWalletAddress=` or `baseCurrencyCode=` would otherwise open the Send
  // flow with an empty address/asset instead of degrading to the no-op the
  // caller uses when the parameter is missing.
  const baseCurrencyCode = query.baseCurrencyCode ?? undefined
  const depositWalletAddress = query.depositWalletAddress ?? undefined
  if (
    baseCurrencyCode == null ||
    baseCurrencyCode.trim() === '' ||
    depositWalletAddress == null ||
    depositWalletAddress.trim() === ''
  )
    return null

  // Only carry an amount when it is a positive finite number. An empty
  // `baseCurrencyAmount=` would otherwise pre-fill a zero send (mul('', m) ===
  // '0'), and a non-numeric value would throw from biggystring AFTER the user
  // finished the wallet picker; drop it here so the Send scene opens without a
  // bogus amount instead.
  const rawAmount = query.baseCurrencyAmount ?? undefined
  const amountNum = rawAmount != null ? Number(rawAmount) : Number.NaN
  const amount =
    Number.isFinite(amountNum) && amountNum > 0 ? rawAmount : undefined

  // Treat a present-but-blank destination tag/memo as absent, so the Send scene
  // gets `undefined` (no memo) rather than an empty-string uniqueIdentifier.
  const rawTag = query.depositWalletAddressTag ?? undefined
  const addressTag = rawTag != null && rawTag.trim() !== '' ? rawTag : undefined

  return {
    type: 'paymentRedirect',
    currencyCode: baseCurrencyCode,
    depositAddress: depositWalletAddress,
    amount,
    addressTag
  }
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

  if (codesString == null)
    throw new SyntaxError('No currency codes found in request for address')

  // Split the asset codes by '-'
  const codes = codesString.split('-')

  // Split each asset code by '_'
  const assets = codes.map(codePair => {
    const splitCodes = codePair.split('_')
    const nativeCode = splitCodes[0].toUpperCase()
    const tokenCode =
      splitCodes.length > 1 ? splitCodes[1].toUpperCase() : nativeCode
    return { nativeCode, tokenCode }
  })

  return { type: 'requestAddress', assets, redir, post, payer }
}

const prefixes: Array<[string, string]> = [
  // Legacy links:
  ['edge-ret://plugins/simplex/', 'edge://plugin/simplex/'],
  ['edge-ret://x-callback-url/', 'edge://x-callback-url/'],
  ['airbitz-ret://x-callback-url/', 'edge://x-callback-url/'],

  // Alternative schemes:
  ['https://deep.edge.app/', 'edge://'],
  ['https://return.edge.app/', 'edge://'],
  ['airbitz://', 'edge://'],
  ['reqaddr://', 'edge://reqaddr']
]

/**
 * Detect an `af` affiliate installer id on a `deep.edge.app` URL and return
 * the extracted id plus the original URL with `af` stripped from the query.
 * Returns `null` for every other input.
 */
function splitAffiliateLink(
  uri: string
): { installerId: string; remainingUri: string } | null {
  if (!uri.startsWith('https://')) return null

  const url = new URL(uri)
  if (url.host !== 'deep.edge.app') return null
  const query = parseQuery(url.query)
  const { af } = query
  if (af == null || af === '') return null

  const remainingQuery: typeof query = {}
  for (const key of Object.keys(query)) {
    if (key !== 'af') remainingQuery[key] = query[key]
  }
  const queryString =
    Object.keys(remainingQuery).length === 0
      ? ''
      : stringifyQuery(remainingQuery)
  const remainingUri = `${url.protocol}//${url.host}${url.pathname}${queryString}${url.hash}`
  return { installerId: af, remainingUri }
}
