import { div } from 'biggystring'
import type {
  EdgeCurrencyWallet,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'

import { getExchangeDenom } from './exchangeDenom'
import { getHistoricalCryptoRate } from './exchangeRates'
import { DECIMAL_PRECISION } from './utils'

const UPDATE_TXS_MAX_PROMISES = 10

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
 * using each transaction's date. Same loop as GUI `updateTxsFiat`: skip
 * when that fiat amount is already non-zero; do not persist.
 */
export async function fillTxsFiat(opts: {
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  isoFiat: string
  txs: EdgeTransaction[]
}): Promise<void> {
  const { wallet, tokenId, isoFiat, txs } = opts
  const exchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)

  let promises: Array<Promise<void>> = []
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
          .catch((e: unknown) => {
            console.warn(e instanceof Error ? e.message : String(e))
          })
      )
      if (promises.length >= UPDATE_TXS_MAX_PROMISES) {
        await Promise.all(promises)
        promises = []
      }
    }
  }
  if (promises.length > 0) {
    await Promise.all(promises)
  }
}
