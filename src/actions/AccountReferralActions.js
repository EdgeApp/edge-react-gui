// @flow

import { asArray, asBoolean, asDate, asMap, asObject, asOptional, asString } from 'cleaners'
import { type EdgeAccount } from 'edge-core-js/types'

import { type Dispatch, type GetState, type State } from '../types/reduxTypes.js'
import { type AccountReferral, type Promotion, type ReferralCache } from '../types/ReferralTypes.js'
import { asCurrencyCodes, asMessageTweaks, asPluginTweaks } from '../types/TweakTypes.js'
import { type TweakSource, lockStartDates } from '../util/ReferralHelpers.js'

const REFERRAL_CACHE_FILE = 'ReferralCache.json'
const ACCOUNT_REFERRAL_FILE = 'CreationReason.json'

/**
 * Call this at login time to load the account referral information.
 */
export const loadAccountReferral = (account: EdgeAccount) => async (dispatch: Dispatch, getState: GetState) => {
  // First try the disk:
  try {
    const [cacheText, referralText] = await Promise.all([
      account.localDisklet.getText(REFERRAL_CACHE_FILE).catch(() => '{}'),
      account.disklet.getText(ACCOUNT_REFERRAL_FILE).catch(() => '{}')
    ])
    const cache = asDiskReferralCache(JSON.parse(cacheText))
    const referral = unpackAccountReferral(JSON.parse(referralText))
    dispatch({ type: 'ACCOUNT_REFERRAL_LOADED', data: { cache, referral } })
    return
  } catch (error) {}

  // Do not affiliate already-created accounts:
  if (!account.newAccount) return

  // Copy the app install reason into the account:
  const state = getState()
  const { installerId, currencyCodes, messages, plugins } = state.deviceReferral
  const creationDate = new Date()
  const referral: AccountReferral = {
    creationDate,
    installerId,
    currencyCodes,
    promotions: [],
    ignoreAccountSwap: false,
    hiddenAccountMessages: {}
  }
  const cache: ReferralCache = {
    accountMessages: lockStartDates(messages, creationDate),
    accountPlugins: lockStartDates(plugins, creationDate)
  }

  dispatch({ type: 'ACCOUNT_REFERRAL_LOADED', data: { cache, referral } })
  saveAccountReferral(getState())
  saveReferralCache(getState())

  // Now try activating the same link as a promotion (with silent errors):
  try {
    await activatePromotion(installerId)(dispatch, getState)
  } catch (error) {}
}

/**
 * Downloads a promotion matching the given install link.
 */
export const activatePromotion = (installerId: string) => async (dispatch: Dispatch, getState: GetState) => {
  const uri = `https://util1.edge.app/api/v1/promo?installerId=${installerId}`
  const reply = await fetch(uri)
  if (!reply.ok) {
    throw new Error(`Util server returned status code ${reply.status}`)
  }
  const clean = asServerTweaks(await reply.json())

  // Lock the start dates:
  const now = new Date()
  const promotion: Promotion = {
    installerId,
    hiddenMessages: {},
    messages: lockStartDates(clean.messages, now),
    plugins: lockStartDates(clean.plugins, now)
  }
  dispatch({ type: 'PROMOTION_ADDED', data: promotion })
  saveAccountReferral(getState())
}

/**
 * Cancels a promotion that a user may have installed from a link.
 */
export const removePromotion = (installerId: string) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'PROMOTION_REMOVED', data: installerId })
  saveAccountReferral(getState())
}

/**
 * Hides the provided message from the user.
 */
export const hideMessageTweak = (messageId: string, source: TweakSource) => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'MESSAGE_TWEAK_HIDDEN', data: { messageId, source } })
  saveAccountReferral(getState())
}

/**
 * Deactivates any swap plugin preferences from the account affiliation.
 */
export const ignoreAccountSwap = () => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({ type: 'ACCOUNT_SWAP_IGNORED' })
  saveAccountReferral(getState())
}

export const refreshAccountReferral = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { installerId, creationDate } = state.account.accountReferral
  if (installerId == null || creationDate == null) return

  const uri = `https://util1.edge.app/api/v1/partner?installerId=${installerId}`
  const reply = await fetch(uri)
  if (!reply.ok) {
    throw new Error(`Util server returned status code ${reply.status}`)
  }
  const clean = asServerTweaks(await reply.json())
  const cache: ReferralCache = {
    accountMessages: lockStartDates(clean.messages, creationDate),
    accountPlugins: lockStartDates(clean.plugins, creationDate)
  }
  dispatch({ type: 'ACCOUNT_TWEAKS_REFRESHED', data: cache })
  saveReferralCache(getState())
}

/**
 * Writes the account referral information from redux to the disk.
 */
async function saveAccountReferral (state: State): Promise<void> {
  const { account } = state.core
  const { accountReferral } = state.account
  await account.disklet.setText(ACCOUNT_REFERRAL_FILE, JSON.stringify(accountReferral))
}

/**
 * Writes the referral cache from redux to the disk.
 */
async function saveReferralCache (state: State): Promise<void> {
  const { account } = state.core
  const { referralCache } = state.account
  await account.localDisklet.setText(REFERRAL_CACHE_FILE, JSON.stringify(referralCache))
}

/**
 * Turns on-disk data into a AccountReferral structure.
 */
function unpackAccountReferral (raw: any): AccountReferral {
  const clean = asDiskAccountReferral(raw)
  const out: AccountReferral = {
    creationDate: clean.creationDate,
    installerId: clean.installerId,
    currencyCodes: clean.currencyCodes,
    promotions: clean.promotions,
    ignoreAccountSwap: clean.ignoreAccountSwap,
    hiddenAccountMessages: clean.hiddenAccountMessages
  }

  // Upgrade legacy fields:
  if (out.currencyCodes == null && clean.currencyCode != null) {
    out.currencyCodes = [clean.currencyCode]
  }
  return out
}

const asDiskPromotion = asObject({
  installerId: asString,
  hiddenMessages: asOptional(asMap(asBoolean), {}),
  messages: asMessageTweaks,
  plugins: asPluginTweaks
})

const asDiskAccountReferral = asObject({
  creationDate: asOptional(asDate),
  installerId: asOptional(asString),
  currencyCodes: asCurrencyCodes,
  promotions: asOptional(asArray(asDiskPromotion), []),

  // User overrides:
  ignoreAccountSwap: asOptional(asBoolean, false),
  hiddenAccountMessages: asOptional(asMap(asBoolean), {}),

  // Legacy:
  currencyCode: asOptional(asString)
})

/**
 * The referral cache, as stored on disk.
 */
const asDiskReferralCache = asObject({
  accountMessages: asMessageTweaks,
  accountPlugins: asPluginTweaks
})

/**
 * Account tweaks & promotions as sent down by the server on refresh.
 */
const asServerTweaks = asObject({
  messages: asMessageTweaks,
  plugins: asPluginTweaks
})
