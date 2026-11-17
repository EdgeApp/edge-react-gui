import { raceTimeout, TIMED_OUT } from '../../../util/raceTimeout'
import { fetchDfx } from './dfxApi'
import {
  asDfxAssets,
  asDfxFiats,
  asDfxSellQuoteResponse,
  wasDfxSellQuoteRequest
} from './dfxRampTypes'

// Runs beside the login under the same quote-approval spinner:
const DFX_QUOTE_TIMEOUT_MS = 10000

export interface DfxSellAmountParams {
  /** DFX blockchain name, such as 'Bitcoin' */
  readonly blockchain: string
  /** DFX asset name, such as 'BTC' */
  readonly asset: string
  /** Fiat currency code without the 'iso:' prefix, such as 'EUR' */
  readonly fiat: string
  /** The fiat the user wants to receive */
  readonly fiatAmount: string
}

/**
 * Asks DFX how much crypto to sell for the fiat amount the user entered.
 * DFX's sell screen only fills its crypto field from a fiat amount once the
 * user has picked a bank account, so the crypto amount is what opens the
 * screen with both sides filled.
 * Returns undefined when DFX cannot quote the amount in time.
 */
export async function fetchDfxSellCryptoAmount(
  params: DfxSellAmountParams
): Promise<string | undefined> {
  try {
    const amount = await raceTimeout(
      quoteSellAmount(params),
      DFX_QUOTE_TIMEOUT_MS
    )
    if (amount === TIMED_OUT) {
      throw new Error(`quote timed out after ${DFX_QUOTE_TIMEOUT_MS}ms`)
    }
    return amount
  } catch (error: unknown) {
    console.warn(`DFX sell quote failed: ${String(error)}`)
    return undefined
  }
}

async function quoteSellAmount(params: DfxSellAmountParams): Promise<string> {
  const { blockchain, asset, fiat, fiatAmount } = params

  const [assets, fiats] = await Promise.all([
    fetchDfx(`/asset?blockchains=${encodeURIComponent(blockchain)}`).then(
      asDfxAssets
    ),
    fetchDfx('/fiat').then(asDfxFiats)
  ])
  const dfxAsset = assets.find(
    item => item.blockchain === blockchain && item.name === asset
  )
  if (dfxAsset == null) throw new Error(`no DFX asset ${blockchain}/${asset}`)
  const dfxFiat = fiats.find(item => item.name === fiat)
  if (dfxFiat == null) throw new Error(`no DFX fiat ${fiat}`)

  const quote = asDfxSellQuoteResponse(
    await fetchDfx('/sell/quote', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: wasDfxSellQuoteRequest({
        asset: { id: dfxAsset.id },
        currency: { id: dfxFiat.id },
        targetAmount: Number(fiatAmount)
      })
    })
  )
  if (!(quote.amount > 0)) throw new Error(`quote amount ${quote.amount}`)

  // DFX rounds its amounts well within 8 decimals. toFixed keeps the
  // string a plain decimal, never exponent notation such as 1e-7:
  return quote.amount.toFixed(8).replace(/\.?0+$/, '')
}
