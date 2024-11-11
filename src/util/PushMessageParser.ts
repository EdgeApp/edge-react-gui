import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { asMaybe, asObject, asString, asValue } from 'cleaners'

import { DeepLink } from '../types/DeepLinkTypes'

/**
 * Extracts a deep link from a push message, if present.
 */
export function parsePushMessage(message: FirebaseMessagingTypes.RemoteMessage): DeepLink | undefined {
  const priceChange = asMaybe(asPriceChangePayloadData)(message.data)
  if (priceChange != null) {
    return {
      type: 'price-change',
      pluginId: priceChange?.pluginId,
      body: asString(message.notification?.body)
    }
  }
}

const asPriceChangePayloadData = asObject({
  type: asValue('price-change'),
  pluginId: asString
})
