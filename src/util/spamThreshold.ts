import type {
  EdgeAccount,
  EdgeCurrencyConfig,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'

import { getHistoricalCryptoRate } from './exchangeRates'
import { readLocalAccountSettingsFromDisk } from './localAccountSettings'
import { calculateSpamThreshold } from './utils'

const emptyEdgeDenomination: EdgeDenomination = Object.freeze({
  name: '',
  multiplier: '1',
  symbol: ''
})

const SYNCED_SETTINGS_FILENAME = 'Settings.json'
const DEFAULT_ISO_FIAT = 'iso:USD'

function getExchangeDenom(
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): EdgeDenomination {
  if (tokenId == null) return currencyConfig.currencyInfo.denominations[0]
  const token = currencyConfig.allTokens[tokenId]
  if (token != null) return token.denominations[0]
  return emptyEdgeDenomination
}

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

/**
 * Same visibility rule as the GUI transaction list.
 * An explicit query override wins. Otherwise honor spamFilterOn (default
 * true) and calculateSpamThreshold from defaultIsoFiat + current rate.
 * Missing rates yield `'0'`, matching calculateSpamThreshold.
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
    rate = await getHistoricalCryptoRate(
      opts.wallet.currencyInfo.pluginId,
      opts.tokenId,
      defaultIsoFiat,
      new Date().toISOString()
    )
  } catch {
    rate = 0
  }
  if (!Number.isFinite(rate)) rate = 0
  return calculateSpamThreshold(rate, denom)
}
