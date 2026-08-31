import { openBrowserAsync } from 'expo-web-browser'
import URL from 'url-parse'

import type { UriQueryMap } from '../types/WebTypes'
import { canOpenURL, openURL } from './linking'

/**
 * Opens a URI in an in-app browser (SFSafariViewController / Chrome Custom
 * Tabs via expo-web-browser). Custom schemes and failures fall back to the
 * system browser. login-ui and RAMP still use react-native-safari-view and
 * react-native-custom-tabs, so those packages stay linked.
 */
export const openBrowserUri = async (uri: string): Promise<void> => {
  if (uri === '') {
    throw new Error('openBrowserUri: Empty uri prop')
  }

  if (/^https?:\/\//i.test(uri)) {
    try {
      await openBrowserAsync(uri)
      return
    } catch {
      // Fall back to the system browser if the in-app browser is unavailable.
    }
  }

  const supported = await canOpenURL(uri)
  if (supported) {
    await openURL(uri)
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
  const test = dummyUrl.query
  // @ts-expect-error
  return test
}

/**
 * Remove the '=' from search params that are not key/value pairs (flags),
 * i.e. 'https://url.com?test=pass&paramA=&foo=bar' => 'https://url.com?test=pass&paramA&foo=bar'
 * This is for adressing a limitation of the url-parse library.
 */
export const cleanQueryFlags = (uri: string): string => {
  return uri.replace(/=(?=&|$)/gm, '')
}
