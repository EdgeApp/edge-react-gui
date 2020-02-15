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
 * Describes the current plugin tweaks.
 */
export type ActivePlugins = {
  preferredFiatPluginId: string | void,
  preferredSwapPluginId: string | void,
  preferredSwapSource: 'settings' | 'creation',
  promoCodes: { [pluginId: string]: string }
}

/**
 * Finds the active message card.
 * Use this with the `getCreationTweaks` selector.
 */
export function getActiveMessage (tweaks: AppTweaks, now: Date = new Date()): AppMessage | void {
  let out: AppMessage | void

  for (const message of tweaks.messages) {
    if (!isActive(message, now)) continue
    out = message
  }

  return out
}

/**
 * Reports the active plugin tweaks.
 * Use this with the `getCreationTweaks` selector.
 */
export function getActivePlugins (creationTweaks: AppTweaks, settingsPreferredSwap: string | void, now: Date = new Date()): ActivePlugins {
  const out: ActivePlugins = {
    preferredFiatPluginId: undefined,
    preferredSwapPluginId: settingsPreferredSwap,
    preferredSwapSource: 'settings',
    promoCodes: {}
  }

  // Search through the account creation plugin tweaks:
  for (const plugin of creationTweaks.plugins) {
    const { pluginId, preferredFiat = false, preferredSwap = false, promoCode } = plugin
    if (!isActive(plugin, now)) continue

    if (preferredFiat) {
      out.preferredFiatPluginId = pluginId
    }
    if (preferredSwap) {
      out.preferredSwapPluginId = pluginId
      out.preferredSwapSource = 'creation'
    }
    if (promoCode != null) out.promoCodes[pluginId] = promoCode
  }

  return out
}

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

function isActive (tweak: AppMessage | AppPlugin, now: Date) {
  const { startDate = now, durationDays } = tweak
  const startTime = startDate.valueOf()
  const endTime = startTime + 24 * 60 * 60 * 1000 * durationDays

  return startTime <= now.valueOf() && now.valueOf() < endTime
}
