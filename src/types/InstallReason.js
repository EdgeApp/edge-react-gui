// @flow

import { type AppMessage, type AppPlugin, type AppTweaks, asAppTweaks } from './AppTweaks.js'

/**
 * Why was this app installed on the phone?
 */
export type InstallReason = {
  installerId?: string,
  appTweaks: AppTweaks
}

/**
 * Why was this app installed on the phone?
 * As it exists on disk, and also as sent from the util server.
 */
export type DiskInstallReason = {
  installerId?: string,

  // Flattened AppTweaks:
  currencyCodes?: string[],
  messages?: AppMessage[],
  plugins?: AppPlugin[],

  // Legacy fields:
  currencyCode?: string,
  swapPluginId?: string
}

/**
 * Turns the on-disk data into an InstallReason structure.
 */
export function unpackInstallReason (raw: DiskInstallReason): InstallReason {
  const { currencyCode, currencyCodes, installerId, messages = [], plugins = [], swapPluginId } = raw

  const out: InstallReason = {
    installerId,
    appTweaks: asAppTweaks({
      currencyCodes: currencyCodes == null && currencyCode != null ? [currencyCode] : currencyCodes,
      messages,
      plugins
    })
  }
  if (typeof swapPluginId === 'string') {
    out.appTweaks.plugins.push({
      pluginId: swapPluginId,
      preferredSwap: true,
      preferredFiat: false,
      promoCode: undefined,
      startDate: undefined,
      durationDays: 180
    })
  }
  return out
}

/**
 * Turns an install reason back into its on-disk format.
 */
export function packInstallReason (reason: InstallReason): DiskInstallReason {
  return {
    installerId: reason.installerId,
    currencyCodes: reason.appTweaks.currencyCodes,
    messages: reason.appTweaks.messages,
    plugins: reason.appTweaks.plugins
  }
}
