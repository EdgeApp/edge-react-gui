import { raceTimeout, TIMED_OUT } from '../../../util/raceTimeout'
import { fetchDfx } from './dfxApi'
import {
  asDfxAssets,
  asDfxFiats,
  asDfxSellEstimateResponse,
  asDfxSellQuoteResponse,
  wasDfxSellEstimateRequest,
  wasDfxSellQuoteRequest
} from './dfxRampTypes'

// Bounds the crypto amount quote, which runs beside the login under the
// quote-approval spinner, and the fiat estimate, which runs beside the route
// fetch after DFX's payment redirect:
const DFX_QUOTE_TIMEOUT_MS = 10000

/** The crypto and fiat of a DFX sell quote, by DFX's names. */
export interface DfxSellPair {
  /** DFX blockchain name, such as 'Bitcoin' */
  readonly blockchain: string
  /** DFX asset name, such as 'BTC' */
  readonly asset: string
  /** Fiat currency code without the 'iso:' prefix, such as 'EUR' */
  readonly fiat: string
}

export interface DfxSellAmountParams extends DfxSellPair {
  /** The fiat the user wants to receive */
  readonly fiatAmount: string
}

export interface DfxSellFiatParams extends DfxSellPair {
  /** The crypto to sell, as an exchange amount */
  readonly cryptoAmount: string
}

/** DFX's ids for the crypto and fiat of a sell quote. */
interface DfxSellPairIds {
  readonly asset: { readonly id: number }
  readonly currency: { readonly id: number }
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
  return await raceDfxQuote(quoteSellAmount(params))
}

/**
 * Asks DFX how much fiat a crypto amount sells for, as a plain decimal with
 * at most 2 decimal places. Returns undefined when DFX cannot quote the
 * amount in time or its estimate is not a positive number.
 */
export async function fetchDfxSellFiatAmount(
  params: DfxSellFiatParams
): Promise<string | undefined> {
  return await raceDfxQuote(quoteSellFiatAmount(params))
}

/**
 * Gives a quote DFX_QUOTE_TIMEOUT_MS to settle. Returns undefined, with a
 * warning, when it fails or takes longer.
 */
async function raceDfxQuote(
  quote: Promise<string>
): Promise<string | undefined> {
  try {
    const amount = await raceTimeout(quote, DFX_QUOTE_TIMEOUT_MS)
    if (amount === TIMED_OUT) {
      throw new Error(`quote timed out after ${DFX_QUOTE_TIMEOUT_MS}ms`)
    }
    return amount
  } catch (error: unknown) {
    console.warn(`DFX sell quote failed: ${String(error)}`)
    return undefined
  }
}

async function fetchDfxSellPairIds(
  params: DfxSellPair
): Promise<DfxSellPairIds> {
  const { blockchain, asset, fiat } = params

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

  return { asset: { id: dfxAsset.id }, currency: { id: dfxFiat.id } }
}

/** Sends a JSON request body to DFX's sell quote. */
async function putDfxSellQuote(body: string): Promise<string> {
  return await fetchDfx('/sell/quote', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body
  })
}

async function quoteSellAmount(params: DfxSellAmountParams): Promise<string> {
  const ids = await fetchDfxSellPairIds(params)

  const quote = asDfxSellQuoteResponse(
    await putDfxSellQuote(
      wasDfxSellQuoteRequest({
        ...ids,
        targetAmount: Number(params.fiatAmount)
      })
    )
  )
  if (!(quote.amount > 0)) throw new Error(`quote amount ${quote.amount}`)

  // DFX rounds its amounts well within 8 decimals. toFixed keeps the
  // string a plain decimal, never exponent notation such as 1e-7:
  return quote.amount.toFixed(8).replace(/\.?0+$/, '')
}

async function quoteSellFiatAmount(params: DfxSellFiatParams): Promise<string> {
  const ids = await fetchDfxSellPairIds(params)

  const quote = asDfxSellEstimateResponse(
    await putDfxSellQuote(
      wasDfxSellEstimateRequest({
        ...ids,
        amount: Number(params.cryptoAmount)
      })
    )
  )

  // toFixed keeps the string a plain decimal, never exponent notation:
  const fiatAmount = quote.estimatedAmount.toFixed(2).replace(/\.?0+$/, '')
  if (!(quote.estimatedAmount > 0) || fiatAmount === '0') {
    throw new Error(`quote estimated amount ${quote.estimatedAmount}`)
  }
  return fiatAmount
}
