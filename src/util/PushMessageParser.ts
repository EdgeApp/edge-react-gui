import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { asMaybe, asObject, asOptional, asString, asValue } from 'cleaners'

import { showDevError } from '../components/services/AirshipInstance'
import type { DeepLink } from '../types/DeepLinkTypes'
import { parseDeepLink } from './DeepLinkParser'

/**
 * Extracts a deep link from a push message, if present.
 */
export function parsePushMessage(
  message: FirebaseMessagingTypes.RemoteMessage
): DeepLink | undefined {
  const priceChange = asMaybe(asPriceChangePayloadData)(message.data)
  if (priceChange != null) {
    return {
      type: 'price-change',
      pluginId: priceChange?.pluginId,
      body: asString(message.notification?.body)
    }
  }

  const marketing = asMaybe(asMarketingPayloadData)(message.data)
  if (marketing != null) {
    let link: DeepLink | undefined
    if (marketing.url != null) {
      try {
        const parsed = parseDeepLink(marketing.url)
        // A campaign navigates wherever its URL points, the same as a link the
        // user taps anywhere else. `parseDeepLink` is lenient and answers
        // `other` for anything it does not recognize, so a malformed campaign
        // URL tracks the open without navigating.
        if (parsed.type !== 'other') link = parsed
      } catch (error: unknown) {
        // parseDeepLink can still throw on some malformed input; never let that
        // drop the push, or we would also lose the open tracking.
        showDevError(error)
      }
    }
    return {
      type: 'marketing',
      campaignId: marketing.campaignId,
      link
    }
  }
}

const asPriceChangePayloadData = asObject({
  type: asValue('price-change'),
  pluginId: asString
})

const asMarketingPayloadData = asObject({
  type: asValue('marketing'),
  campaignId: asString,
  url: asOptional(asString)
})
