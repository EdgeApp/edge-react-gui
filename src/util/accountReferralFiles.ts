import {
  asArray,
  asBoolean,
  asDate,
  asObject,
  asOptional,
  asString
} from 'cleaners'

import { asAppleAdsAttribution } from '../types/AppleAdsAttributionTypes'
import type { AccountReferral, ReferralCache } from '../types/ReferralTypes'
import {
  asCurrencyCode,
  asMessageTweak,
  asPluginTweak
} from '../types/TweakTypes'

/**
 * The account's referral files, and the cleaners that read them.
 *
 * The app reads them at login in `loadAccountReferral`, and the CLI reads
 * them for each swap quote, because the referral and its promotions decide
 * which swap providers are disabled, which is preferred and which promo codes
 * go with the request.
 *
 * Node-safe: no react-native, no Redux.
 */

/** The tweaks the referral server last sent, on `account.localDisklet`. */
export const REFERRAL_CACHE_FILE = 'ReferralCache.json'

/** The account's affiliation and promotions, on `account.disklet`. */
export const ACCOUNT_REFERRAL_FILE = 'CreationReason.json'

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
  activePromotions: asOptional(asArray(asString), []),
  accountAppleAdsAttribution: asOptional(asAppleAdsAttribution),

  // User overrides:
  ignoreAccountSwap: asOptional(asBoolean, false),
  hiddenAccountMessages: asOptional(asObject(asBoolean), {}),

  // Legacy:
  currencyCode: asOptional(asString)
})

/**
 * The referral cache, as stored on disk.
 */
export const asDiskReferralCache = asObject({
  accountMessages: asOptional(asArray(asMessageTweak), []),
  accountPlugins: asOptional(asArray(asPluginTweak), [])
})

/**
 * Turns on-disk data into a AccountReferral structure.
 */
export function unpackAccountReferral(raw: unknown): AccountReferral {
  const clean = asDiskAccountReferral(raw)
  const out: AccountReferral = {
    creationDate: clean.creationDate,
    installerId: clean.installerId,
    currencyCodes: clean.currencyCodes,
    promotions: clean.promotions,
    ignoreAccountSwap: clean.ignoreAccountSwap,
    hiddenAccountMessages: clean.hiddenAccountMessages,
    activePromotions: clean.activePromotions,
    accountAppleAdsAttribution: clean.accountAppleAdsAttribution
  }

  // Upgrade legacy fields:
  if (out.currencyCodes == null && clean.currencyCode != null) {
    out.currencyCodes = [clean.currencyCode]
  }
  return out
}

/**
 * The account's referral and its cache, as the app reads them at login.
 *
 * A cache that cannot be read is empty. A referral that cannot be read means
 * the account is not affiliated, and then neither file counts, as in the app.
 * The app's refresh from the referral server is not done here.
 */
export async function readAccountReferral(account: {
  disklet: { getText: (path: string) => Promise<string> }
  localDisklet: { getText: (path: string) => Promise<string> }
}): Promise<{ cache: ReferralCache; referral: AccountReferral }> {
  try {
    const [cacheText, referralText] = await Promise.all([
      account.localDisklet.getText(REFERRAL_CACHE_FILE).catch(() => '{}'),
      account.disklet.getText(ACCOUNT_REFERRAL_FILE)
    ])
    let cache: ReferralCache
    try {
      cache = asDiskReferralCache(JSON.parse(cacheText))
    } catch {
      cache = { accountMessages: [], accountPlugins: [] }
    }
    return {
      cache,
      referral: unpackAccountReferral(JSON.parse(referralText))
    }
  } catch {
    return {
      cache: { accountMessages: [], accountPlugins: [] },
      referral: {
        promotions: [],
        ignoreAccountSwap: false,
        hiddenAccountMessages: {},
        activePromotions: []
      }
    }
  }
}
