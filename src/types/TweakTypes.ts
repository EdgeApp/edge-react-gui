import { asArray, asBoolean, asDate, asNumber, asObject, asOptional, asString, asValue, Cleaner } from 'cleaners'

/**
 * A currency code to create a wallet for, normalized to uppercase.
 */
export const asCurrencyCode: Cleaner<string> = raw => asString(raw).toUpperCase()

/**
 * An message card to show the user.
 *
 * The URI might include placeholders like `%BTC`,
 * which we replace with an address
 */
export interface MessageTweak {
  message: string
  localeMessages?: { [locale: string]: string }
  uri?: string
  iconUri?: string

  countryCodes?: string[]
  excludeCountryCodes?: string[]
  hasLinkedBankMap?: { [pluginId: string]: boolean }
  exactBuildNum?: string
  minBuildNum?: string
  maxBuildNum?: string
  osTypes?: Array<'ios' | 'android' | 'windows' | 'macos' | 'web'>

  startDate?: Date
  durationDays: number
  version?: string
}

export const asMessageTweak = asObject<MessageTweak>({
  message: asString,
  localeMessages: asOptional(asObject(asString)),
  uri: asOptional(asString),
  iconUri: asOptional(asString),

  countryCodes: asOptional(asArray(asString)),
  excludeCountryCodes: asOptional(asArray(asString)),
  hasLinkedBankMap: asOptional(asObject(asBoolean)), // Map of pluginIds
  exactBuildNum: asOptional(asString),
  minBuildNum: asOptional(asString),
  maxBuildNum: asOptional(asString),
  osTypes: asOptional(asArray(asValue('ios', 'android', 'windows', 'macos', 'web'))),

  startDate: asOptional(asDate),
  durationDays: asNumber,
  version: asOptional(asString)
})

/**
 * Adjusts a plugin's behavior within the app,
 * such as by making it preferred.
 */
export interface PluginTweak {
  pluginId: string
  preferredFiat?: boolean
  preferredSwap?: boolean
  promoCode?: string
  promoMessage?: string
  disabled: boolean

  startDate?: Date
  durationDays: number
}

export const asPluginTweak = asObject<PluginTweak>({
  pluginId: asString,
  preferredFiat: asOptional(asBoolean),
  preferredSwap: asOptional(asBoolean),
  promoCode: asOptional(asString),
  promoMessage: asOptional(asString),
  disabled: asOptional(asBoolean, false),

  startDate: asOptional(asDate),
  durationDays: asNumber
})

export const asIpApi = asObject({
  countryCode: asString
})
