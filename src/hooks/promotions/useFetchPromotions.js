// @flow

import { asArray, asBoolean, asDate, asMaybe, asObject, asOptional, asString, asValue } from 'cleaners'

import { config } from '../../theme/appConfig.js'
import { useFetch } from '../useFetch.js'

const asPromotion = asObject({
  messageId: asString,
  message: asObject(
    // keys are language identifiers (ie. 'enUS')
    asObject({
      title: asString,
      body: asString,
      imageUrl: asString
    })
  ),
  locations: asObject(
    // Keys are 2-character country codes (ie. 'US')
    asBoolean
  ),
  appFlags: asObject(
    // Keys are unique account attributes (ie. 'wyreLinkedBank')
    asBoolean
  ),
  appId: asOptional(asString),
  forPlatform: asValue('ios', 'android'),
  maxVersion: asString,
  minVersion: asString,
  startDate: asDate,
  endDate: asDate
})

const asNotifications = asObject({
  notifications: asMaybe(asArray(asMaybe(asPromotion)), [])
})

export type Promotion = $Call<typeof asPromotion>

// Hook to get an array of all the promotions from the server
export const useFetchPromotions = () => {
  const { data } = useFetch(`${config.infoServer}/v1/notifications`, {
    asData: (data: any) => asNotifications(data).notifications.filter(Boolean),
    defaultData: []
  })
  return data
}
