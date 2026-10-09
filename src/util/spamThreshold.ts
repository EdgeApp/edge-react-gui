/**
 * The spam-transaction threshold, and the fiat it is measured in.
 *
 * A dust receive below the user's threshold is hidden from a transaction
 * list, and the same rule has to apply to `get-transactions` — so the
 * settings read, the rate lookup and the comparison are shared rather than
 * reimplemented in the engine.
 *
 * Node-safe, like everything the CLI shares: no react-native, no Redux, no
 * Airship.
 */
import { div } from 'biggystring'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'

import { getExchangeDenom } from './exchangeDenom'
import { getHistoricalCryptoRate } from './exchangeRates'
import {
  LOCAL_SETTINGS_FILENAME,
  readLocalAccountSettingsOrDefaults
} from './localAccountSettings'
import {
  asSyncedSettingsSubset,
  readSyncedSettingsOrThrow
} from './syncedSettingsFile'

/**
 * The native amount a receive has to exceed to be shown.
 *
 * multiplier / exchange rate / (1 / unit): 100000000 / $16500 / (1/$0.001)
 * is about 6 sats. Declared here and imported directly by the three GUI
 * callers: this module is on the CLI's import graph, `utils.ts` reaches the
 * locales and the Redux selectors, and a `utils.ts` re-export closes the
 * cycle `utils → spamThreshold → exchangeRates → network → utils`.
 */
export const calculateSpamThreshold = (
  rate: number,
  denom: EdgeDenomination
): string => {
  if (rate === 0) return '0'
  return div(div(denom.multiplier, rate.toString()), '1000')
}

/**
 * Synced account Settings.json on account.disklet (not localDisklet).
 * defaultIsoFiat defaults to iso:USD, matching asSyncedAccountSettings.
 *
 * Through the strict reader, so a `Settings.json` that is *there* and cannot
 * be read is not answered the way an absent one is. This value labels and
 * prices a whole `get-transactions` response and every CSV, QBO and Bitwave
 * file written from it: one unreadable read used to price the lot in
 * `iso:USD` and report USD back as the account's own default. An absent file
 * still gets the cleaner's default, which is what a fresh account has.
 */
export async function readDefaultIsoFiat(
  account: EdgeAccount
): Promise<string> {
  return defaultIsoFiatOf(await readSyncedSettingsOrThrow(account))
}

/**
 * The same answer from settings a caller has already read.
 *
 * `get-transactions` needs `denominationSettings` out of the same file on its
 * export path, so going back through `readDefaultIsoFiat` there read and
 * parsed `Settings.json` a second time for a field it was holding.
 */
export function defaultIsoFiatOf(settings: { defaultIsoFiat: string }): string {
  // The cleaner's fallback covers an absent field; an empty *string* in the
  // file is a value it would keep, and no fiat code is the empty string.
  return settings.defaultIsoFiat === ''
    ? asSyncedSettingsSubset({}).defaultIsoFiat
    : settings.defaultIsoFiat
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
   * The *account's* fiat, resolved by the caller.
   *
   * Passed in rather than read again: the only caller already reads the
   * account's synced `Settings.json` for it, and reading it a second time for
   * the identical answer is the whole cost of this function's default path.
   * Not the caller's display fiat — `--fiat` moves what amounts are shown
   * in, never the floor they are compared against.
   */
  isoFiat?: string
  queryOverride?: string
  /**
   * Where an unreadable `Settings.json` is reported.
   *
   * The only notice used to be `localAccountSettings`' own `console.warn`,
   * which in the daemon goes to the startup log a clean stop deletes. A
   * plain callback rather than the engine's `EngineReporter`, because this
   * module is on the GUI's import graph too.
   */
  onWarn?: (message: string) => void
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
  const { settings, trusted } = await readLocalAccountSettingsOrDefaults(
    opts.account
  )
  // `trusted` is false for a file that is *there* and could not be read, and
  // `spamFilterOn` then defaults to `true` — so an unreadable settings file
  // applied the floor to an account that had turned the filter off, dropping
  // rows from a listing and from an export the route documents as
  // unfiltered, with `total` counted against the filtered set. No threshold
  // is the safe direction, the same one a non-finite rate already takes.
  if (!trusted) {
    opts.onWarn?.(
      `${LOCAL_SETTINGS_FILENAME} is present and unreadable, so the spam ` +
        'filter is not being applied'
    )
    return undefined
  }
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
