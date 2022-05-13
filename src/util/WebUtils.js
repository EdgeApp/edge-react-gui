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
export const stringifyUriAndQuery = (uri: string, query: UriQueryMap): string => {
  const url = new URL(uri)
  const existingQueries = parseQuery(url.query)

  // Decide whether to use '&' or '?' to add new queries into the uri.
  const joiningChar = Object.keys(existingQueries).length > 0 ? '&' : '?'
  return `${omitLastChar(uri, '/')}${joiningChar}${stringifyQuery(query)}`
}

/**
 * Remove last character if it matches the param
 */
export const omitLastChar = (uri: string, lastChar: string): string => {
  return uri.substr(-1) === lastChar ? uri.substr(0, uri.length - 1) : uri
}

/**
 * -Replaces reserved characters with escape sequences representing the UTF-8
 * encoding of the character.
 * -Joins each query with '&'
 */
export const stringifyQuery = (query: UriQueryMap): string => {
  return Object.keys(query)
    .map(key => {
      let out = encodeURIComponent(key)
      if (query[key] != null) out += `=${encodeURIComponent(query[key])}`
      return out
    })
    .join('&')
}

/**
 * Parses the query portion of a URL/URI into a UriQueryMap.
 * Does NOT extract the query from the complete URI!
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
