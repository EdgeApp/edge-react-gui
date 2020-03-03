// @flow

import { type MessageTweak, type PluginTweak } from './TweakTypes.js'

/**
 * Why was this app installed on the phone?
 */
export type DeviceReferral = {
  installerId?: string,
  currencyCodes?: string[],
  messages: MessageTweak[],
  plugins: PluginTweak[]
}

// A promotion that can be activated by tapping a link.
export type Promotion = {
  installerId: string,
  hiddenMessages: { [messageId: string]: boolean },
  messages: MessageTweak[],
  plugins: PluginTweak[]
}

/**
 * Why was this account created?
 * Stored in the account.
 */
export type AccountReferral = {
  creationDate?: Date,
  installerId?: string,
  currencyCodes?: string[],
  promotions: Promotion[],

  // Set this to true to disable swap overrides from account affiliation:
  ignoreAccountSwap: boolean,

  // Add account messages to this array to prevent them from appearing:
  hiddenAccountMessages: { [messageId: string]: boolean }
}

/**
 * Refreshable referral information, stored locally on the phone.
 */
export type ReferralCache = {
  accountMessages: MessageTweak[],
  accountPlugins: PluginTweak[]
}
