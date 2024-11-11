import { asArray, asBoolean, asDate, asObject, asOptional, asString } from 'cleaners'
import { EdgeDataStore } from 'edge-core-js'
import { EdgeAccount } from 'edge-core-js/types'

import { ENV } from '../env'
import { RootState, ThunkAction } from '../types/reduxTypes'
import { AccountReferral, Promotion, ReferralCache } from '../types/ReferralTypes'
import { asCurrencyCode, asIpApi, asMessageTweak, asPluginTweak } from '../types/TweakTypes'
import { fetchReferral } from '../util/network'
import { lockStartDates, TweakSource } from '../util/ReferralHelpers'
import { logEvent } from '../util/tracking'

const REFERRAL_CACHE_FILE = 'ReferralCache.json'
const ACCOUNT_REFERRAL_FILE = 'CreationReason.json'

/**
 * Call this at login time to load the account referral information.
 */
export function loadAccountReferral(account: EdgeAccount): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    // First try the disk:
    try {
      if (account?.disklet?.setText == null) return
      if (account?.localDisklet?.setText == null) return

      const [cacheText, referralText] = await Promise.all([
        // Cache errors are fine:
        account.localDisklet.getText(REFERRAL_CACHE_FILE).catch(() => '{}'),
        // Referral errors mean we aren't affiliated:
        account.disklet.getText(ACCOUNT_REFERRAL_FILE)
      ])
      const cache = asDiskReferralCache(JSON.parse(cacheText))
      const referral = unpackAccountReferral(JSON.parse(referralText))
      dispatch({ type: 'ACCOUNT_REFERRAL_LOADED', data: { cache, referral } })
      return
    } catch (error: any) {}

    // Try new account affiliation:
    if (account.newAccount) {
      try {
        await createAccountReferral()(dispatch, getState)
        return
      } catch (error: any) {}
    }

    // Otherwise, just use default values:
    const referral: AccountReferral = {
      promotions: [],
      ignoreAccountSwap: false,
      hiddenAccountMessages: {}
    }
    const cache: ReferralCache = {
      accountMessages: [],
      accountPlugins: []
    }
    dispatch({ type: 'ACCOUNT_REFERRAL_LOADED', data: { cache, referral } })
  }
}

/**
 * Copies device referral information into the account on first login.
 */
function createAccountReferral(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
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
    await Promise.all([saveAccountReferral(getState()), saveReferralCache(getState())])

    dispatch(logEvent('Load_Install_Reason_Match'))

    // Also try activating the same link as a promotion (with silent errors):
    if (installerId != null) {
      await activatePromotion(installerId)(dispatch, getState).catch(() => undefined)
    }
  }
}

/**
 * Downloads a promotion matching the given install link.
 */
export function activatePromotion(installerId: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const uri = `api/v1/promo?installerId=${installerId}`
    let reply
    try {
      reply = await fetchReferral(uri)
    } catch (e: any) {
      console.warn(`Failed to contact referral server`)
      return
    }
    if (!reply.ok) {
      const text = await reply.text()
      console.warn(`activatePromotion:fetch ${uri} ${text}`)
      if (reply.status === 404) {
        console.warn(`Invalid promotion code ${installerId}`)
        return
      }
      console.warn(`Referral server returned status code ${reply.status}`)
      return
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
    await saveAccountReferral(getState())
  }
}

/**
 * Cancels a promotion that a user may have installed from a link.
 */
export function removePromotion(installerId: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    dispatch({ type: 'PROMOTION_REMOVED', data: installerId })
    await saveAccountReferral(getState())
  }
}

/**
 * Hides the provided message from the user.
 */
export function hideMessageTweak(messageId: string, source: TweakSource): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    dispatch({ type: 'MESSAGE_TWEAK_HIDDEN', data: { messageId, source } })
    await saveAccountReferral(getState())
  }
}

/**
 * Deactivates any swap plugin preferences from the account affiliation.
 */
export function ignoreAccountSwap(ignore: boolean = true): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    dispatch({ type: 'ACCOUNT_SWAP_IGNORED', data: ignore })
    await saveAccountReferral(getState())
  }
}

export function refreshAccountReferral(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { installerId = 'no-installer-id', creationDate = new Date('2018-01-01') } = state.account.accountReferral
    const cache: ReferralCache = {
      accountMessages: [],
      accountPlugins: []
    }

    const uri = `api/v1/partner?installerId=${installerId}`
    let reply
    try {
      reply = await fetchReferral(uri)
      if (!reply.ok) {
        throw new Error(`Returned status code ${reply.status}`)
      }
      const clean = asServerTweaks(await reply.json())
      cache.accountMessages.push(...lockStartDates(clean.messages, creationDate))
      cache.accountPlugins.push(...lockStartDates(clean.plugins, creationDate))
    } catch (e: any) {
      console.warn(`Failed to contact referral server: ${e.message}`)
    }

    // Get promo cards from info server
    if (cache.accountMessages.length <= 0 && cache.accountPlugins.length <= 0) return
    dispatch({ type: 'ACCOUNT_TWEAKS_REFRESHED', data: cache })
    await saveReferralCache(getState())
  }
}

export interface ValidateFuncs {
  getCountryCodeByIp: () => Promise<string>

  // Placeholder dummy routine we can fill in with real plugin when we have one
  checkDummyPluginHasBank: (dataStore: EdgeDataStore) => Promise<boolean | undefined>
  getBuildNumber: () => string
  getLanguageTag: () => string
  getOs: () => string
  getVersion: () => string
}

export const getCountryCodeByIp = async (): Promise<string | undefined> => {
  const apiKey = ENV.IP_API_KEY ?? ''

  try {
    const reply = await fetch(`https://pro.ip-api.com/json/?key=${apiKey}`)
    const { countryCode } = asIpApi(await reply.json())
    return countryCode
  } catch (e: any) {
    console.warn(`getCountryCodeByIp() failed: ${String(e)}`)
    return undefined
  }
}

/**
 * Writes the account referral information from redux to the disk.
 */
async function saveAccountReferral(state: RootState): Promise<void> {
  const { account } = state.core
  const { accountReferral } = state.account
  await account?.disklet?.setText(ACCOUNT_REFERRAL_FILE, JSON.stringify(accountReferral))
}

/**
 * Writes the referral cache from redux to the disk.
 */
async function saveReferralCache(state: RootState): Promise<void> {
  const { account } = state.core
  const { referralCache } = state.account
  await account?.localDisklet?.setText(REFERRAL_CACHE_FILE, JSON.stringify(referralCache))
}

/**
 * Turns on-disk data into a AccountReferral structure.
 */
function unpackAccountReferral(raw: any): AccountReferral {
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
  hiddenMessages: asOptional(asObject(asBoolean), () => ({})),
  messages: asOptional(asArray(asMessageTweak), () => []),
  plugins: asOptional(asArray(asPluginTweak), () => [])
})

const asDiskAccountReferral = asObject({
  creationDate: asOptional(asDate),
  installerId: asOptional(asString),
  currencyCodes: asOptional(asArray(asCurrencyCode)),
  promotions: asOptional(asArray(asDiskPromotion), []),

  // User overrides:
  ignoreAccountSwap: asOptional(asBoolean, false),
  hiddenAccountMessages: asOptional(asObject(asBoolean), {}),

  // Legacy:
  currencyCode: asOptional(asString)
})

/**
 * The referral cache, as stored on disk.
 */
const asDiskReferralCache = asObject({
  accountMessages: asOptional(asArray(asMessageTweak), []),
  accountPlugins: asOptional(asArray(asPluginTweak), [])
})

/**
 * Account tweaks & promotions as sent down by the server on refresh.
 */
const asServerTweaks = asObject({
  messages: asOptional(asArray(asMessageTweak), []),
  plugins: asOptional(asArray(asPluginTweak), [])
})
