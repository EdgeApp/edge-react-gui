// @flow

import URL from 'url-parse'

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
  query: { [key: string]: string }
}

export type PromotionLink = {
  type: 'promotion',
  installerId?: string
}

export type ReturnAddressLink = {
  type: 'returnAddress',
  uri: string, // TODO: Remove once we stop needing to double-parse
  currencyName: string,
  sourceName?: string,
  successUri?: string
}

export type DeepLink =
  | EdgeLoginLink
  | PasswordRecoveryLink
  | PluginLink
  | PromotionLink
  | ReturnAddressLink
  | {
      type: 'other',
      protocol: string, // Without the ':'
      uri: string
    }

/**
 * Parse a link into the app, identifying special
 * features that Edge knows how to handle.
 */
export function parseDeepLink (uri: string): DeepLink {
  const url = new URL(uri, true)

  // Check for https://deep.edge.app/[resource]/[path...]
  //  Where resource = [plugins|...]
  if (url.protocol === 'https:' && url.host === 'deep.edge.app') {
    const pathParts = url.pathname.split('/')
    const [resourceName = ''] = pathParts.splice(1, 1)
    if (resourceName === 'plugins') {
      const [pluginId = ''] = pathParts.splice(1, 1)
      const path = pathParts.join('/')
      return { type: 'plugin', pluginId, path, query: url.query }
    }
  }

  // Check for edge://[resource]/[path...]
  if (url.protocol === 'edge:') {
    switch (url.host) {
      case 'plugins':
        const pathParts = url.pathname.split('/')
        const [pluginId = ''] = pathParts.splice(1, 1)
        const path = pathParts.join('/')
        return { type: 'plugin', pluginId, path, query: url.query }
      default:
        // Do Nothing
        break
    }
  }

  // Check for edge login links:
  if ((url.protocol === 'edge:' && url.host === 'edge') || (url.protocol === 'airbitz:' && url.host === 'edge')) {
    return { type: 'edgeLogin', lobbyId: url.pathname.slice(1) }
  }

  // Check for edge login HTTPS links:
  if (url.protocol === 'https:' && url.host === 'www.edge.app' && url.pathname === '/edgelogin') {
    const { address = '' } = url.query
    return { type: 'edgeLogin', lobbyId: address }
  }

  // Check for recovery links:
  if (
    (url.protocol === 'https:' && url.host === 'recovery.edgesecure.co') ||
    (url.protocol === 'edge:' && url.host === 'recovery') ||
    (url.protocol === 'airbitz:' && url.host === 'recovery')
  ) {
    const { token = '' } = url.query
    return { type: 'passwordRecovery', passwordRecoveryKey: token }
  }

  // Check for plugin deep links:
  if (url.protocol === 'edge-ret:' && url.host === 'plugins') {
    const pathParts = url.pathname.split('/')
    const [pluginId = ''] = pathParts.splice(1, 1)
    const path = pathParts.join('/')
    return { type: 'plugin', pluginId, path, query: url.query }
  }

  // Check for promotion links:
  if ((url.protocol === 'https:' && url.host === 'dl.edge.app') || (url.protocol === 'edge:' && url.host === 'promotion')) {
    const pathParts = url.pathname.split('/')
    const installerId = pathParts[1]
    return { type: 'promotion', installerId }
  }

  // Check for the bitcoin-ret protocol:
  if ((/^[a-z]+-ret:$/.test(url.protocol) || url.protocol === 'airbitz:' || url.protocol === 'edge:') && url.host === 'x-callback-url') {
    // The currency name can have two locations depending on the protocol:
    // edge-ret://x-callback-url/request-litecoin-address
    // litecoin-ret://x-callback-url/request-address
    const currencyNameMatch = /^airbitz|^edge/.test(url.protocol) ? /^\/request-([a-z]+)-address/.exec(url.pathname) : /^([a-z]+)-ret:$/.exec(url.protocol)

    // Extract the options:
    if (currencyNameMatch != null) {
      const currencyName = currencyNameMatch[1]
      const sourceName = url.query['x-source']
      const successUri = url.query['x-success']
      return { type: 'returnAddress', currencyName, sourceName, successUri, uri }
    }

    // Fall through, since without a currency name, it must be something else:
  }

  // Assume anything else is a coin link of some kind:
  const protocol = url.protocol.replace(/:$/, '')
  return { type: 'other', protocol, uri }
}
