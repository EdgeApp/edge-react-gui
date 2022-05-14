// @flow
import { Linking, Platform } from 'react-native'
import SafariView from 'react-native-safari-view'
import URL from 'url-parse'

import { type UriQueryMap } from '../types/WebTypes'

// TODO: Replace everything with the 'url-parse' library where possible

export type OpenBrowserUriParams = { uri: string, isSafariView: boolean }

/**
 * Uses the device's browser to open a URI.
 * */
export const openBrowserUri = ({ uri, isSafariView }: OpenBrowserUriParams) => {
  if (uri === '') {
    throw new Error('openBrowserUri: Empty uri prop')
  }
  // Try to open a SafariView, if requested and supported
  if (isSafariView && Platform.OS === 'ios') {
    return SafariView.isAvailable()
      .then(SafariView.show({ url: uri }))
      .catch(error => {
        // Fallback WebView code for iOS 8 and earlier
        console.warn(`openBrowserUri: Could not open '${uri}' in Safari: ${error.message}`)
        Linking.openURL(uri)
      })
  } else {
    // Android
    Linking.canOpenURL(uri).then(supported => {
      if (supported) {
        Linking.openURL(uri)
      } else {
        throw new Error('openBrowserUri: Unsupported uri: ' + uri)
      }
    })
  }
}

/**
 * Adds query params onto a uri that potentially already has existing query
 * params set.
 *
 * This function also cleans the end of the original uri, handling '/'
 * terminated uri's
 */
export const stringifyUriAndQuery = (uri: string, newQueries: UriQueryMap): string => {
  const url = new URL(uri)
  const query = parseQuery(url.query)
  Object.keys(query).forEach(key => (query[key] = newQueries[key]))
  url.query = stringifyQuery(query)
  return url.toString()
}

/**
 * -Replaces reserved characters with escape sequences representing the UTF-8
 * encoding of the character.
 * -Joins each query with '&'
 */
export const stringifyQuery = (query: UriQueryMap): string => {
  const queryKeys = Object.keys(query)
  if (queryKeys.length === 0) return ''
  const nonNullQuery = queryKeys.map(key => [key, query[key] ?? ''])
  const searchParams = new URLSearchParams(nonNullQuery)
  return searchParams.toString().replace(/=(?=&|$)/gm, '')
}

/**
 * Parses the query portion of a URL/URI into a UriQueryMap.
 * Does NOT extract the query from the complete URI!
 *
 * TODO: jontz: Does not work with URLSearchParams...
 * */
export const parseQuery = (query?: string): UriQueryMap => {
  if (query == null || query === '') return {}

  // The literal '&' divides query arguments:
  const parts = query.slice(1).split('&')

  const out: UriQueryMap = {}
  for (const part of parts) {
    // The literal '=' divides the key from the value:
    const key = part.replace(/=.*/, '')
    const value = part.slice(key.length)

    // Avoid dangerous keys:
    const safeKey = decodeURIComponent(key)
    if (safeKey === '__proto__') continue

    // A key without an '=' gets a null value:
    out[safeKey] = value === '' ? null : decodeURIComponent(value.slice(1))
  }
  return out
}
