import { asArray, asBoolean, asDate, asObject, asOptional, asString } from 'cleaners'
import { EdgeDataStore } from 'edge-core-js'
import { EdgeAccount } from 'edge-core-js/types'
import { Platform } from 'react-native'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import { getLocales } from 'react-native-localize'

import { ENV } from '../env'
import { pickLanguage } from '../locales/intl'
import { checkWyreHasLinkedBank } from '../plugins/gui/fiatPlugin'
import { config } from '../theme/appConfig'
import { RootState, ThunkAction } from '../types/reduxTypes'
import { AccountReferral, Promotion, ReferralCache } from '../types/ReferralTypes'
import { asCurrencyCode, asIpApi, asMessageTweak, asPluginTweak, MessageTweak } from '../types/TweakTypes'
import { fetchInfo, fetchReferral } from '../util/network'
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

    logEvent('Load_Install_Reason_Match', { installerId })
    dispatch({ type: 'ACCOUNT_REFERRAL_LOADED', data: { cache, referral } })
    await Promise.all([saveAccountReferral(getState()), saveReferralCache(getState())])

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
      console.warn(`Referral server returned status code ${reply.status}`)
    }
    if (reply.status === 404) {
      throw new Error(`Invalid promotion code ${installerId}`)
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

    let uri = `api/v1/partner?installerId=${installerId}`
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
    const appId = config.appId ?? 'edge'

    uri = `v1/promoCards/${appId}`
    try {
      reply = await fetchInfo(uri)
      if (!reply.ok) {
        throw new Error(`Returned status code ${reply.status}`)
      }
      const clean = asArray(asMessageTweak)(await reply.json())
      const validated = await validatePromoCards(state.core.account, clean)
      cache.accountMessages.push(...lockStartDates(validated, creationDate))
    } catch (e: any) {
      console.warn(`Failed to contact info server: ${e.message}`)
    }

    if (cache.accountMessages.length <= 0 && cache.accountPlugins.length <= 0) return
    dispatch({ type: 'ACCOUNT_TWEAKS_REFRESHED', data: cache })
    await saveReferralCache(getState())
  }
}

export interface ValidateFuncs {
  getCountryCodeByIp: () => Promise<string>
  checkWyreHasLinkedBank: (dataStore: EdgeDataStore) => Promise<boolean | undefined>
  getBuildNumber: () => string
  getLanguageTag: () => string
  getOs: () => string
  getVersion: () => string
}

const getCountryCodeByIp = async (): Promise<string> => {
  const apiKey = ENV.IP_API_KEY ?? ''
  let out = '--'
  try {
    const reply = await fetch(`https://pro.ip-api.com/json/?key=${apiKey}`)
    const { countryCode } = asIpApi(await reply.json())
    out = countryCode
  } catch (e: any) {
    console.error(e.message)
  }
  return out
}
const getLanguageTag = (): string => {
  const [firstLocale = { languageTag: 'en_US' }] = getLocales()
  return firstLocale.languageTag
}
const getOs = (): string => Platform.OS

async function validatePromoCards(account: EdgeAccount, cards: MessageTweak[]): Promise<MessageTweak[]> {
  const funcs: ValidateFuncs = { getCountryCodeByIp, checkWyreHasLinkedBank, getBuildNumber, getLanguageTag, getOs, getVersion }
  return await validatePromoCardsInner(account.dataStore, cards, funcs)
}
export async function validatePromoCardsInner(dataStore: EdgeDataStore, cards: MessageTweak[], funcs: ValidateFuncs): Promise<MessageTweak[]> {
  const out: MessageTweak[] = []
  let wyreHasLinkedBank

  for (const card of cards) {
    // Validate OS type
    if (card.osTypes != null) {
      const match = card.osTypes.some(os => os === funcs.getOs())
      if (!match) continue
    }

    // Validate app buildnum
    const buildNum = funcs.getBuildNumber()
    if (typeof card.exactBuildNum === 'string') {
      if (card.exactBuildNum !== buildNum) continue
    }
    if (typeof card.minBuildNum === 'string') {
      if (card.minBuildNum > buildNum) continue
    }
    if (typeof card.maxBuildNum === 'string') {
      if (card.maxBuildNum < buildNum) continue
    }

    if (typeof card.version === 'string') {
      const version = funcs.getVersion()
      if (card.version !== version) continue
    }

    if (card.countryCodes != null) {
      // Validate Country
      const countryCode = await funcs.getCountryCodeByIp()
      const match = (card.countryCodes ?? []).some(cc => cc === countryCode)
      if (!match) continue
    }

    if (card.excludeCountryCodes != null) {
      // Validate Country
      const countryCode = await funcs.getCountryCodeByIp()
      const excludeMatch = (card.excludeCountryCodes ?? []).some(cc => cc === countryCode)
      if (excludeMatch) continue
    }

    // Validate Bank Linkage
    if (card.hasLinkedBankMap != null) {
      let useCard = true
      for (const [pluginId, hasLinkedBank] of Object.entries(card.hasLinkedBankMap)) {
        if (pluginId === 'co.edgesecure.wyre') {
          if (wyreHasLinkedBank == null) {
            wyreHasLinkedBank = await funcs.checkWyreHasLinkedBank(dataStore)
          }
          if (wyreHasLinkedBank !== hasLinkedBank) {
            useCard = false
            break
          }
        } else {
          // We can't track any other types of bank linkage so punt on this promo card.
          useCard = false
          break
        }
      }
      if (!useCard) continue
    }

    // Pick proper language
    if (card.localeMessages != null) {
      const localeList = Object.keys(card.localeMessages ?? {})
      const lang = pickLanguage(funcs.getLanguageTag(), localeList)
      if (lang != null) {
        const message = (card.localeMessages ?? {})[lang]
        if (message != null) {
          card.message = message
        }
      }
    }
    out.push(card)
  }

  return out
}

/**
 * Writes the account referral information from redux to the disk.
 */
async function saveAccountReferral(state: RootState): Promise<void> {
  const { account } = state.core
  const { accountReferral } = state.account
  await account.disklet.setText(ACCOUNT_REFERRAL_FILE, JSON.stringify(accountReferral))
}

/**
 * Writes the referral cache from redux to the disk.
 */
async function saveReferralCache(state: RootState): Promise<void> {
  const { account } = state.core
  const { referralCache } = state.account
  await account.localDisklet.setText(REFERRAL_CACHE_FILE, JSON.stringify(referralCache))
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
