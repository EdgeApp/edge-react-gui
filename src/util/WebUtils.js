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
 * -Replaces reserved characters with escape sequences representing the UTF-8
 * encoding of the character.
 * -Joins each query with '&'
 * -Remove the '=' character from queries that are not key/value pairs.
 *  The URLSearchParams/url-parse library expects all queries to be made of key=value pairs only.
 */
export const stringifyQuery = (query: UriQueryMap): string => {
  const queryKeys = Object.keys(query)
  if (queryKeys.length === 0) return ''
  const nonNullQuery = queryKeys.map(key => [key, query[key] ?? ''])
  const searchParams = new URLSearchParams(nonNullQuery)

  return cleanQueryFlags(searchParams.toString())
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
