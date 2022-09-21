import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { asObject, asString, asValue } from 'cleaners'
import URL from 'url-parse'

//
// Payloads to be added to the PushMessages
//

export type PriceChangePayload = {
  type: 'price-change'
  pluginId: string
  body: string
}

const asPriceChangePayloadData = asObject({
  type: asValue('price-change'),
  pluginId: asString
})

export const pushMessagePayloadToEdgeUri = (message: FirebaseMessagingTypes.RemoteMessage): string => {
  const { type, pluginId } = asPriceChangePayloadData(message.data)
  const body = asString(message.notification?.body)
  return `edge://${type}?${URL.qs.stringify({ body, pluginId })}`
}
