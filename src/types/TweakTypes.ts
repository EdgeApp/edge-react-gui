import { asArray, asBoolean, asDate, asMap, asNumber, asObject, asOptional, asString, asValue, Cleaner } from 'cleaners'

/**
 * A currency code to create a wallet for, normalized to uppercase.
 */
export const asCurrencyCode: Cleaner<string> = raw => asString(raw).toUpperCase()

/**
 * An message card to show the user.
 *
 * TODO: The URI might include placeholders like `%BTC`,
 * which we replace with an address
 */
export const asMessageTweak = asObject({
  message: asString,
  localeMessages: asOptional(asMap(asString)),
  uri: asOptional(asString),
  iconUri: asOptional(asString),

  countryCodes: asOptional(asArray(asString)),
  hasLinkedBankMap: asOptional(asMap(asBoolean)), // Map of pluginIds
  exactBuildNum: asOptional(asString),
  minBuildNum: asOptional(asString),
  maxBuildNum: asOptional(asString),
  osTypes: asOptional(asArray(asValue('ios', 'android', 'windows', 'macos', 'web'))),

  startDate: asOptional(asDate),
  durationDays: asNumber
})
export type MessageTweak = ReturnType<typeof asMessageTweak>

/**
 * Adjusts a plugin's behavior within the app,
 * such as by making it preferred.
 */
export const asPluginTweak = asObject({
  pluginId: asString,
  preferredFiat: asOptional(asBoolean),
  preferredSwap: asOptional(asBoolean),
  promoCode: asOptional(asString),
  promoMessage: asOptional(asString),
  disabled: asOptional(asBoolean, false),

  startDate: asOptional(asDate),
  durationDays: asNumber
})
export type PluginTweak = ReturnType<typeof asPluginTweak>

export const asIpApi = asObject({
  countryCode: asString
})
