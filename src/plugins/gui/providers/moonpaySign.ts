import { asObject, asString } from 'cleaners'

import { ENV } from '../../../env'
import { fetchInfo, fetchWaterfall } from '../../../util/network'

const asMoonpaySignResponse = asObject({ signedUrl: asString })

const asMoonpayRelayCheckResponse = asObject({ interstitialUrl: asString })

const SIGN_URL_PATH = 'v1/moonpay/signUrl'
const SIGN_URL_TIMEOUT_MS = 10000

/**
 * POST a signUrl request to the info server and return the parsed JSON reply.
 * In dev builds a non-empty `signProxy` reroutes the request through that
 * alternate egress instead of the info servers (still with the same timeout),
 * which is how the relay-check divergence branch is reproduced on a
 * simulator.
 */
const postSignUrl = async (
  body: object,
  signProxy?: string
): Promise<unknown> => {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
  const response =
    signProxy != null && signProxy !== ''
      ? await fetchWaterfall(
          [signProxy.replace(/\/+$/, '')],
          SIGN_URL_PATH,
          options,
          SIGN_URL_TIMEOUT_MS
        )
      : await fetchInfo(SIGN_URL_PATH, options, SIGN_URL_TIMEOUT_MS)
  if (!response.ok) {
    throw new Error(`Moonpay URL signing failed: ${response.status}`)
  }
  return await response.json()
}

/**
 * Ask the info server to bind a Moonpay widget URL to the caller's public IP
 * and sign it. Moonpay's on-ramp security upgrade refuses to load widget URLs
 * that are not signed and IP-bound, so every buy/sell widget URL must be routed
 * through here before it is opened.
 */
export const signMoonpayUrl = async (url: string): Promise<string> => {
  const reply = await postSignUrl({ url })
  return asMoonpaySignResponse(reply).signedUrl
}

/**
 * Ask the info server for a Private Relay interstitial URL instead of a
 * directly signed widget URL. The interstitial is for the iOS buy flow only:
 * the widget opens in an SFSafariViewController whose traffic can egress
 * through iCloud Private Relay, so the server must observe the Safari view's
 * own address before deciding whether to bind the widget URL to an IP. The
 * returned URL is opened in the Safari view and 302s to the signed widget
 * URL; the app never handles an IP.
 *
 * In dev builds, `ENV.MOONPAY_RELAY_CHECK_SIGN_PROXY` reroutes this one POST
 * through an alternate egress so the server sees divergent app/Safari
 * addresses on a simulator, making the unbound branch reproducible. The flag
 * is dead in release builds.
 */
export const fetchMoonpayInterstitialUrl = async (
  url: string
): Promise<string> => {
  const signProxy = __DEV__ ? ENV.MOONPAY_RELAY_CHECK_SIGN_PROXY : undefined
  const reply = await postSignUrl({ url, relayCheck: true }, signProxy)
  const { interstitialUrl } = asMoonpayRelayCheckResponse(reply)
  // An empty URL would open a blank Safari view with no error; throwing here
  // routes the caller onto its bound-URL fallback instead.
  if (interstitialUrl === '') {
    throw new Error('Moonpay relay check returned an empty interstitial URL')
  }
  return interstitialUrl
}
