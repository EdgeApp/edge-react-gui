// @flow

import { type AccountReferral } from '../types/ReferralTypes.js'
import { type MessageTweak, type PluginTweak } from '../types/TweakTypes.js'

/**
 * Where did the preferred swap plugin setting come from?
 */
export type TweakSource =
  | { type: 'settings' }
  | { type: 'account' }
  | {
      type: 'promotion',
      installerId: string
    }

/**
 * A message, along with an ID that we can use to cancel it.
 */
export type MessageSummary = {
  message: MessageTweak,
  messageId: string,
  messageSource: TweakSource
}

/**
 * Combined effects of serveral plugin tweaks.
 */
export type PluginSummary = {
  preferredFiatPluginId: string | void,
  preferredSwapPluginId: string | void,
  disabled: { [pluginId: string]: true },
  promoCodes: { [pluginId: string]: string },
  promoMessages: { [pluginId: string]: string }
}

/**
 * Finds the active message card.
 */
export function bestOfMessages(
  accountMessages: MessageTweak[], // From the local cache
  accountReferral: AccountReferral, // From the account storage
  now: Date = new Date()
): MessageSummary | void {
  // Try the plugins first:
  let i = accountReferral.promotions.length
  while (--i >= 0) {
    const promo = accountReferral.promotions[i]
    const source = { type: 'promotion', installerId: promo.installerId }
    const topMessage = getTopMessage(promo.messages, source, promo.hiddenMessages, now)
    if (topMessage != null) return topMessage
  }

  // Fall back on the account affiliate informaton:
  const source = { type: 'account' }
  return getTopMessage(accountMessages, source, accountReferral.hiddenAccountMessages, now)
}

/**
 * Reports the active plugin tweaks.
 */
export function bestOfPlugins(
  accountPlugins: PluginTweak[], // From the local cache
  accountReferral: AccountReferral, // From the account storage
  settingsPreferredSwap: string | void,
  now: Date = new Date()
): PluginSummary & { swapSource: TweakSource } {
  // Start with the app settings:
  let swapSource: TweakSource = { type: 'settings' }
  let out: PluginSummary = {
    preferredFiatPluginId: undefined,
    preferredSwapPluginId: settingsPreferredSwap,
    disabled: {},
    promoCodes: {},
    promoMessages: {}
  }

  // Fold in the account affiliate information:
  const fromAccount = summarizePlugins(accountPlugins, now)
  if (accountReferral.ignoreAccountSwap) fromAccount.preferredSwapPluginId = undefined
  out = mergePluginSummaries(out, fromAccount)
  if (out.preferredSwapPluginId === fromAccount.preferredSwapPluginId) {
    swapSource = { type: 'account' }
  }

  // Fold in the active promotions:
  for (const promo of accountReferral.promotions) {
    const fromPromo = summarizePlugins(promo.plugins, now)
    out = mergePluginSummaries(out, fromPromo)
    if (out.preferredSwapPluginId === fromPromo.preferredSwapPluginId && fromPromo.preferredFiatPluginId != null) {
      swapSource = { type: 'promotion', installerId: promo.installerId }
    }
  }

  return { ...out, swapSource: swapSource }
}

/**
 * Replaces default start dates with definite ones.
 */
export function lockStartDates<T: { startDate?: Date }>(tweaks: T[], startDate: Date): T[] {
  return tweaks.map(tweak => {
    return tweak.startDate == null ? { ...tweak, startDate } : tweak
  })
}

/**
 * Merges two active message structures, preferring the later one.
 */
function mergePluginSummaries(a: PluginSummary, b: PluginSummary): PluginSummary {
  const { preferredFiatPluginId = a.preferredFiatPluginId } = b
  const { preferredSwapPluginId = a.preferredSwapPluginId } = b
  return {
    preferredFiatPluginId,
    preferredSwapPluginId,
    disabled: { ...a.disabled, ...b.disabled },
    promoCodes: { ...a.promoCodes, ...b.promoCodes },
    promoMessages: { ...a.promoMessages, ...b.promoMessages }
  }
}

/**
 * Finds the active message that occurs latest in the array.
 */
function getTopMessage(messages: MessageTweak[], source: TweakSource, hidden: { [messageId: string]: boolean }, now: Date): MessageSummary | void {
  let i = messages.length
  while (--i >= 0) {
    const message = messages[i]
    if (!isActive(message, now)) continue
    const messageId = getMessageId(message)
    if (hidden[messageId]) continue
    return { message, messageId, messageSource: source }
  }
}

/**
 * Combines a group of plugin tweaks into a single report.
 */
function summarizePlugins(plugins: PluginTweak[], now: Date): PluginSummary {
  const out: PluginSummary = {
    preferredFiatPluginId: undefined,
    preferredSwapPluginId: undefined,
    disabled: {},
    promoCodes: {},
    promoMessages: {}
  }

  // Search through the account creation plugin tweaks:
  for (const plugin of plugins) {
    const { pluginId, disabled, preferredFiat = false, preferredSwap = false, promoCode, promoMessage } = plugin
    if (!isActive(plugin, now)) continue

    if (preferredFiat) out.preferredFiatPluginId = pluginId
    if (preferredSwap) out.preferredSwapPluginId = pluginId
    if (disabled) out.disabled[pluginId] = true
    if (promoCode != null) out.promoCodes[pluginId] = promoCode
    if (promoMessage != null) out.promoMessages[pluginId] = promoMessage
  }
  return out
}

/**
 * Creates a unique id for a message, like '180.00 2020-02-20T20:20:20Z bob'.
 */
function getMessageId(message: MessageTweak): string {
  const { startDate, durationDays } = message

  const days = durationDays.toFixed(2)
  return startDate != null ? days + ' ' + startDate.toISOString().replace(/\.\d+Z/, 'Z') : days
}

function isActive(tweak: MessageTweak | PluginTweak, now: Date): boolean {
  const { startDate = now, durationDays } = tweak
  const startTime = startDate.valueOf()
  const endTime = startTime + 24 * 60 * 60 * 1000 * durationDays

  return startTime <= now.valueOf() && now.valueOf() < endTime
}
