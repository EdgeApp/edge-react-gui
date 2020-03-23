// @flow

import { type Cleaner, asArray, asBoolean, asDate, asNumber, asObject, asOptional, asString } from 'cleaners'

/**
 * A currency code to create a wallet for, normalized to uppercase.
 */
export const asCurrencyCode: Cleaner<string> = raw => asString(raw).toUpperCase()
export const asCurrencyCodes = asOptional(asArray(asCurrencyCode))

/**
 * An message card to show the user.
 *
 * TODO: The URI might include placeholders like `%BTC`,
 * which we replace with an address
 */
export const asMessageTweak = asObject({
  message: asString,
  uri: asOptional(asString),
  iconUri: asOptional(asString),

  startDate: asOptional(asDate),
  durationDays: asNumber
})
export type MessageTweak = $Call<typeof asMessageTweak, any>
export const asMessageTweaks: Cleaner<MessageTweak[]> = asOptional(asArray(asMessageTweak), [])

/**
 * Adjusts a plugin's behavior within the app,
 * such as by making it preferred.
 */
export const asPluginTweak = asObject({
  pluginId: asString,
  preferredFiat: asOptional(asBoolean),
  preferredSwap: asOptional(asBoolean),
  promoCode: asOptional(asString),
  disabled: asOptional(asBoolean, false),

  startDate: asOptional(asDate),
  durationDays: asNumber
})
export type PluginTweak = $Call<typeof asPluginTweak, any>
export const asPluginTweaks: Cleaner<PluginTweak[]> = asOptional(asArray(asPluginTweak), [])
