import { Linking } from 'react-native'
import URL from 'url-parse'

import type { UriQueryMap } from '../types/WebTypes'

/**
 * Uses the device's browser to open a URI.
 * */
export const openBrowserUri = async (uri: string): Promise<void> => {
  if (uri === '') {
    throw new Error('openBrowserUri: Empty uri prop')
  }
  const supported = await Linking.canOpenURL(uri)
  if (supported) {
    await Linking.openURL(uri)
  } else {
    throw new Error('openBrowserUri: Unsupported uri: ' + uri)
  }
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
  // `url-parse` types `query` as `string | Record<string, string>` depending
  // on its `parseQuery` flag, which it cannot narrow from the `true` above.
  // Narrowed rather than suppressed, which is the point of the change here.
  //
  // The `?? null` below is defensive, not a fix for an observed bug: the
  // library's querystring parser yields `''` for a value-less flag, never
  // `undefined` — `new URL('https://x?flag', true).query` is
  // `{ flag: '' }`, which is why `cleanQueryFlags` above exists at all — but
  // its types say `string | undefined`, and `UriQueryMap` promises
  // `string | null`, so this keeps the two honest without claiming the
  // `null` arm is reachable today.
  const parsed = dummyUrl.query
  if (typeof parsed === 'string') return {}
  const out: UriQueryMap = {}
  for (const [key, value] of Object.entries(parsed)) {
    out[key] = value ?? null
  }
  return out
}

/**
 * Remove the '=' from search params that are not key/value pairs (flags),
 * i.e. 'https://url.com?test=pass&paramA=&foo=bar' => 'https://url.com?test=pass&paramA&foo=bar'
 * This is for adressing a limitation of the url-parse library.
 */
export const cleanQueryFlags = (uri: string): string => {
  return uri.replace(/=(?=&|$)/gm, '')
}
