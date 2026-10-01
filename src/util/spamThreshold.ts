import type { EdgeAccount, EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { getExchangeDenom } from './exchangeDenom'
import { getHistoricalCryptoRate } from './exchangeRates'
import { readLocalAccountSettingsOrDefaults } from './localAccountSettings'
import {
  asSyncedSettingsSubset,
  readSyncedSettings
} from './syncedSettingsFile'
import { calculateSpamThreshold } from './utils'

/**
 * Synced account Settings.json on account.disklet (not localDisklet).
 * defaultIsoFiat defaults to iso:USD, matching asSyncedAccountSettings.
 */
export async function readDefaultIsoFiat(
  account: EdgeAccount
): Promise<string> {
  const { defaultIsoFiat } = await readSyncedSettings(account)
  // The cleaner's fallback covers an absent field; an empty *string* in the
  // file is a value it would keep, and no fiat code is the empty string.
  return defaultIsoFiat === ''
    ? asSyncedSettingsSubset({}).defaultIsoFiat
    : defaultIsoFiat
}

/** An hour is finer than a dust threshold needs and coarse enough to cache. */
const RATE_BUCKET_MS = 60 * 60 * 1000

/**
 * Same visibility rule as the GUI transaction list, with a different rate
 * source: the GUI reads live rates from Redux, this asks for a historical
 * rate at the current hour. An explicit query override wins. Otherwise honor
 * spamFilterOn (default true) and calculateSpamThreshold from defaultIsoFiat
 * and that rate. A missing or non-finite rate yields `'0'` — no filtering —
 * where the GUI's live rate would have filtered.
 */
export async function resolveListSpamThreshold(opts: {
  account: EdgeAccount
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  /**
   * The fiat to price in, resolved by the caller.
   *
   * Passed in rather than read again: the only caller has already resolved
   * it, and reading the account's synced `Settings.json` a second time for
   * the identical answer is the whole cost of this function's default path.
   */
  isoFiat?: string
  queryOverride?: string
}): Promise<string | undefined> {
  // An empty override means "no threshold", which core spells `'0'`. The
  // REST route cannot produce it — `queryToObject` reads `?spamThreshold=` as
  // an absent parameter, and `?spamThreshold=0` is the spelling that route
  // documents — but a direct caller can, and `''` must not reach core.
  if (opts.queryOverride !== undefined) {
    return opts.queryOverride === '' ? '0' : opts.queryOverride
  }

  // Lenient, and this is the one that matters most: a `Settings.json` that
  // cannot be read used to fail *every* `get-transactions`, on the default
  // path, with nothing here catching it.
  const { settings } = await readLocalAccountSettingsOrDefaults(opts.account)
  if (!settings.spamFilterOn) return undefined

  const defaultIsoFiat =
    opts.isoFiat ?? (await readDefaultIsoFiat(opts.account))
  const denom = getExchangeDenom(opts.wallet.currencyConfig, opts.tokenId)
  let rate = 0
  try {
    // Quantised to the hour. `getHistoricalCryptoRate` folds the date string
    // into its cache key, so a millisecond-precision timestamp missed the
    // cache on every call: each listing waited a full FETCH_FREQUENCY before
    // the request even started, and left a permanent entry in the module-level
    // rate map. In the GUI this value came from a Redux selector, so neither
    // cost existed there.
    const bucketedNow = new Date(
      Math.floor(Date.now() / RATE_BUCKET_MS) * RATE_BUCKET_MS
    ).toISOString()
    rate = await getHistoricalCryptoRate(
      opts.wallet.currencyInfo.pluginId,
      opts.tokenId,
      defaultIsoFiat,
      bucketedNow
    )
  } catch {
    rate = 0
  }
  if (!Number.isFinite(rate)) rate = 0
  return calculateSpamThreshold(rate, denom)
}
