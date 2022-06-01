// @flow
import { Linking } from 'react-native'
import URL from 'url-parse'

import { type UriQueryMap } from '../types/WebTypes'

/**
 * Uses the device's browser to open a URI.
 * */
export const openBrowserUri = (uri: string) => {
  if (uri === '') {
    throw new Error('openBrowserUri: Empty uri prop')
  }
  Linking.canOpenURL(uri).then(supported => {
    if (supported) {
      Linking.openURL(uri)
    } else {
      throw new Error('openBrowserUri: Unsupported uri: ' + uri)
    }
  })
}

/**
 * Returns formatted query string ie. '?country=AU&payment_id=5035'
 */
export const stringifyQuery = (query: UriQueryMap): string => {
  const url = new URL('', true)
  url.set('query', query)
  return cleanQueryFlags(url.href)
}

/**
 * Parses the query portion of a URL/URI into a UriQueryMap.
 * Does NOT extract the query from the complete URI!
 * */
export const parseQuery = (query?: string): UriQueryMap => {
  if (query == null) return {}
  const dummyUrl = new URL('https://dummyurl.com?' + query, true)
  const test = dummyUrl.query
  return test
}

/**
 * Remove the '=' from search params that are not key/value pairs (flags),
 * i.e. 'https://url.com?test=pass&paramA=&foo=bar' => 'https://url.com?test=pass&paramA&foo=bar'
 * This is for adressing a limitation of the url-parse library.
 */
export const cleanQueryFlags = (uri: string): string => {
  return uri.toString().replace(/=(?=&|$)/gm, '')
}
