import { div } from 'biggystring'
import type {
  EdgeCurrencyWallet,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'

import { errorMessage } from './errorMessage'
import { getExchangeDenom } from './exchangeDenom'
import {
  getHistoricalCryptoRateOrUnavailable,
  isRateUnavailable
} from './exchangeRates'
import { DECIMAL_PRECISION } from './fiatConstants'
import { reportWarning } from './reportWarning'

/**
 * What one fill managed.
 *
 * `asked` counts the transactions whose fiat amount was missing, and
 * `unavailable` those the rates queue gave up on rather than priced —
 * `get-transactions` refuses an export when that is non-zero, because a
 * silently truncated accounting export is worse than a slow one.
 */
export interface FillTxsFiatResult {
  asked: number
  unavailable: number
}

/**
 * Fill missing `metadata.exchangeAmount[isoFiat]` from the rates server,
 * using each transaction's date. Skips a transaction whose fiat amount is
 * already non-zero, and persists nothing.
 *
 * `TransactionExportActions`' `updateTxsFiat` is a short thunk that reads
 * `defaultIsoFiat` out of Redux and calls this, so there is no parallel
 * implementation to keep in step.
 *
 * Every rate is queued before anything is awaited. The rate queue batches
 * into requests below RATES_SERVER_MAX_QUERY_SIZE assets and spaces them
 * FETCH_FREQUENCY apart, so awaiting in fixed-size groups instead would pay
 * that spacing for every group, and a large wallet would wait past the CLI
 * client's own socket timeout.
 */
export async function fillTxsFiat(opts: {
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  isoFiat: string
  txs: EdgeTransaction[]
  /** The whole fill's budget, from the caller's own deadline. */
  chainTimeoutMs?: number
}): Promise<FillTxsFiatResult> {
  const { wallet, tokenId, isoFiat, txs, chainTimeoutMs } = opts
  const exchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)

  const promises: Array<Promise<void>> = []
  let asked = 0
  let unavailable = 0
  for (const tx of txs) {
    const amountFiat = tx.metadata?.exchangeAmount?.[isoFiat] ?? 0

    if (amountFiat === 0) {
      const date = new Date(tx.date * 1000).toISOString()
      ++asked
      promises.push(
        getHistoricalCryptoRateOrUnavailable(
          wallet.currencyInfo.pluginId,
          tokenId,
          isoFiat,
          date,
          undefined,
          undefined,
          chainTimeoutMs
        )
          .then(rate => {
            // `RATE_UNAVAILABLE` means the queue gave up — its budget
            // expired, a request failed, the queue was stopped — not that
            // the server cannot price this date, which it spells `0`.
            // Writing `0 * amount` for it would make an accounting export
            // silently wrong instead of slow, so the field is left alone and
            // the caller is told how many.
            if (isRateUnavailable(rate)) {
              ++unavailable
              return
            }
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
            // Through the shared sink, because in the daemon `console`
            // reaches only the startup log, not the engine log, and a rates
            // failure here is the reason a whole accounting export carries
            // no fiat value.
            ++unavailable
            reportWarning(
              `could not price a transaction in ${isoFiat}: ${errorMessage(
                error
              )}`
            )
          })
      )
    }
  }
  await Promise.all(promises)
  if (unavailable > 0) {
    reportWarning(
      `${unavailable} of ${asked} transactions could not be priced in ` +
        `${isoFiat}: the rates queue gave up before answering`
    )
  }
  return { asked, unavailable }
}
