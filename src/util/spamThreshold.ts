import type { EdgeAccount, EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'

import { getExchangeDenom } from './exchangeDenom'
import { getHistoricalCryptoRate } from './exchangeRates'
import { readLocalAccountSettingsFromDisk } from './localAccountSettings'
import { calculateSpamThreshold } from './utils'

const SYNCED_SETTINGS_FILENAME = 'Settings.json'
const DEFAULT_ISO_FIAT = 'iso:USD'

/**
 * Synced account Settings.json on account.disklet (not localDisklet).
 * defaultIsoFiat defaults to iso:USD, matching asSyncedAccountSettings.
 */
export async function readDefaultIsoFiat(
  account: EdgeAccount
): Promise<string> {
  try {
    const text = await account.disklet.getText(SYNCED_SETTINGS_FILENAME)
    const json = JSON.parse(text) as { defaultIsoFiat?: unknown }
    if (typeof json.defaultIsoFiat === 'string' && json.defaultIsoFiat !== '') {
      return json.defaultIsoFiat
    }
  } catch {
    // missing or invalid — use default
  }
  return DEFAULT_ISO_FIAT
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
  queryOverride?: string
}): Promise<string | undefined> {
  if (opts.queryOverride !== undefined) {
    return opts.queryOverride === '' ? '0' : opts.queryOverride
  }

  const settings = await readLocalAccountSettingsFromDisk(opts.account)
  if (!settings.spamFilterOn) return undefined

  const defaultIsoFiat = await readDefaultIsoFiat(opts.account)
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
