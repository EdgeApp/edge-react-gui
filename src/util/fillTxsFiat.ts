import { div } from 'biggystring'
import type {
  EdgeCurrencyWallet,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'

import { getExchangeDenom } from './exchangeDenom'
import { getHistoricalCryptoRate } from './exchangeRates'
import { DECIMAL_PRECISION } from './utils'

/**
 * Accept a 3-letter ISO 4217 code (`USD`, `eur`) or `iso:USD`.
 * Returns `iso:USD` or undefined when the input is not a fiat code.
 */
export function toIsoFiatCode(raw: string): string | undefined {
  let code = raw.trim().toUpperCase()
  if (code.startsWith('ISO:')) code = code.slice(4)
  if (!/^[A-Z]{3}$/.test(code)) return undefined
  return `iso:${code}`
}

/**
 * Fill missing `metadata.exchangeAmount[isoFiat]` from the rates server,
 * using each transaction's date. Skips a transaction whose fiat amount is
 * already non-zero, and persists nothing.
 *
 * This is the loop `updateTxsFiat` used to run inline;
 * `TransactionExportActions` is now a short thunk that reads `defaultIsoFiat`
 * out of Redux and calls this, so there is no parallel implementation to keep
 * in step.
 *
 * Every rate is queued before anything is awaited. `getHistoricalCryptoRate`
 * batches into one request of up to RATES_SERVER_MAX_QUERY_SIZE assets and
 * debounces by FETCH_FREQUENCY per batch, so awaiting in fixed-size groups
 * instead bought a fresh debounce every group: 1,200 unpriced transactions
 * cost ~120s of pure waiting in groups of ten, past the CLI client's own
 * socket timeout, against ~1.1s queued all at once.
 */
export async function fillTxsFiat(opts: {
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  isoFiat: string
  txs: EdgeTransaction[]
}): Promise<void> {
  const { wallet, tokenId, isoFiat, txs } = opts
  const exchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)

  const promises: Array<Promise<void>> = []
  for (const tx of txs) {
    const amountFiat = tx.metadata?.exchangeAmount?.[isoFiat] ?? 0

    if (amountFiat === 0) {
      const date = new Date(tx.date * 1000).toISOString()
      promises.push(
        getHistoricalCryptoRate(
          wallet.currencyInfo.pluginId,
          tokenId,
          isoFiat,
          date
        )
          .then(rate => {
            tx.metadata = {
              ...tx.metadata,
              exchangeAmount: {
                ...tx.metadata?.exchangeAmount,
                [isoFiat]:
                  rate *
                  Number(
                    div(
                      tx.nativeAmount,
                      exchangeDenom.multiplier,
                      DECIMAL_PRECISION
                    )
                  )
              }
            }
          })
          .catch((error: unknown) => {
            console.warn(error instanceof Error ? error.message : String(error))
          })
      )
    }
  }
  await Promise.all(promises)
}
