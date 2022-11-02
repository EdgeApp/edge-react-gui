import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { asMaybe, asObject, asString, asValue } from 'cleaners'
import URL from 'url-parse'

//
// Payloads to be added to the PushMessages
//

export interface PriceChangePayload {
  type: 'price-change'
  pluginId: string
  body: string
}

const asPriceChangePayloadData = asObject({
  type: asValue('price-change'),
  pluginId: asString
})

export const pushMessagePayloadToEdgeUri = (message: FirebaseMessagingTypes.RemoteMessage): string | undefined => {
  const data = asMaybe(asPriceChangePayloadData)(message.data)
  if (data == null) return
  const { type, pluginId } = data
  const body = asString(message.notification?.body)
  return `edge://${type}?${URL.qs.stringify({ body, pluginId })}`
}
