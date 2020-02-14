// @flow

import { asArray, asBoolean, asDate, asNumber, asObject, asOptional, asString } from 'cleaners'

const cleanStringArray = asArray(asString)

function asCurrencyCodes (raw: any): string[] {
  return cleanStringArray(raw).map(code => code.toUpperCase())
}

/**
 * An message card to show the user.
 *
 * TODO: The URI might include placeholders like `%BTC`,
 * which we replace with an address
 */
export const asAppMessage = asObject({
  message: asString,
  uri: asOptional(asString),
  iconUri: asOptional(asString),

  startDate: asOptional(asDate),
  durationDays: asNumber
})
export type AppMessage = $Call<typeof asAppMessage, any>

/**
 * Adjusts a plugin's behavior within the app,
 * such as by making it preferred.
 */
export const asAppPlugin = asObject({
  pluginId: asString,
  preferredFiat: asOptional(asBoolean),
  preferredSwap: asOptional(asBoolean),
  promoCode: asOptional(asString),

  startDate: asOptional(asDate),
  durationDays: asNumber
})
export type AppPlugin = $Call<typeof asAppPlugin, any>

/**
 * Adjusts the Edge application's behavior.
 */
export const asAppTweaks = asObject({
  currencyCodes: asOptional(asCurrencyCodes),
  messages: asArray(asAppMessage),
  plugins: asArray(asAppPlugin)
})
export type AppTweaks = $Call<typeof asAppTweaks, any>

/**
 * Replaces default start dates with definite ones.
 */
export function lockStartDates (tweaks: AppTweaks, startDate: Date) {
  const messages: AppMessage[] = tweaks.messages.map(message => {
    return message.startDate == null ? { ...message, startDate } : message
  })
  const plugins: AppPlugin[] = tweaks.plugins.map(plugin => {
    return plugin.startDate == null ? { ...plugin, startDate } : plugin
  })
  return { ...tweaks, messages, plugins }
}
