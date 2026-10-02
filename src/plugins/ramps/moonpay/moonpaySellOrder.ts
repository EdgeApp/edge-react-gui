import {
  asEither,
  asNull,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'
import type { EdgeAccount, EdgeMemo, EdgeTxActionFiat } from 'edge-core-js'

import type { EdgeAsset } from '../../../types/types'
import { resolveMoonpayAsset } from './moonpayAssetUtils'
import { asMetadata } from './moonpayRampTypes'

export const MOONPAY_PROVIDER_ID = 'moonpay'
export const MOONPAY_DISPLAY_NAME = 'MoonPay'
export const MOONPAY_SUPPORT_EMAIL = 'support@moonpay.com'

/** The one sell status where MoonPay is still waiting for the crypto. */
const MOONPAY_SELL_STATUS_OPEN = 'waitingForDeposit'

// Cleaner for MoonPay GET /v3/sell_transactions/:id response
const asMoonpaySellTransaction = asObject({
  status: asString,
  baseCurrencyAmount: asNumber,
  baseCurrency: asObject({
    code: asString,
    metadata: asOptional(asMetadata)
  }),
  quoteCurrencyAmount: asOptional(asEither(asNumber, asNull)),
  quoteCurrency: asOptional(asEither(asObject({ code: asString }), asNull)),
  depositWallet: asOptional(
    asEither(
      asObject({
        walletAddress: asString,
        walletAddressTag: asOptional(asEither(asString, asNull))
      }),
      asNull
    )
  )
})

export interface MoonpaySellOrderOptions {
  apiKey: string
  apiUrl: string
}

/** An order MoonPay is waiting on, with everything the Send scene needs. */
export interface MoonpayOpenSellOrder {
  type: 'open'
  status: string
  asset: EdgeAsset
  depositAddress: string
  addressTag?: string
  /** Whole units of `asset`, as a decimal string. */
  exchangeAmount: string
  fiatAmount?: string
  /** Upper-case, without the `iso:` prefix. */
  fiatCurrencyCode?: string
}

export type MoonpaySellOrderResult =
  | MoonpayOpenSellOrder
  /** The order exists but no longer takes a deposit. */
  | { type: 'notOpen'; status: string }
  /** The order could not be read, or names an asset Edge cannot pin down. */
  | { type: 'error'; reason: 'lookupFailed' | 'notFound' | 'unknownAsset' }

/**
 * Look a MoonPay sell order up by id and report what, if anything, the user
 * still owes it.
 *
 * A "Send with Edge" link carries the deposit address, amount and currency in
 * a URL anybody can write, and names the currency by a ticker that several
 * networks share. The order itself is the authority, so every value in the
 * result comes from MoonPay's response and none from the link. Never throws:
 * a failure of any kind is an `error` result, and the caller sends nothing.
 */
export const fetchMoonpaySellOrder = async (
  account: EdgeAccount,
  transactionId: string,
  opts: MoonpaySellOrderOptions
): Promise<MoonpaySellOrderResult> => {
  const { apiKey, apiUrl } = opts

  let order: ReturnType<typeof asMoonpaySellTransaction>
  try {
    const response = await fetch(
      `${apiUrl}/v3/sell_transactions/${encodeURIComponent(
        transactionId
      )}?apiKey=${encodeURIComponent(apiKey)}`
    )
    if (response.status === 404) return { type: 'error', reason: 'notFound' }
    if (!response.ok) {
      console.warn(`MoonPay sell order lookup failed: HTTP ${response.status}`)
      return { type: 'error', reason: 'lookupFailed' }
    }
    order = asMoonpaySellTransaction(await response.json())
  } catch (error: unknown) {
    console.warn(`MoonPay sell order lookup failed: ${String(error)}`)
    return { type: 'error', reason: 'lookupFailed' }
  }

  const { status } = order
  if (status !== MOONPAY_SELL_STATUS_OPEN) return { type: 'notOpen', status }

  const { baseCurrency, baseCurrencyAmount, depositWallet } = order
  const depositAddress = depositWallet?.walletAddress.trim() ?? ''
  if (
    depositAddress === '' ||
    !Number.isFinite(baseCurrencyAmount) ||
    baseCurrencyAmount <= 0
  ) {
    console.warn('MoonPay sell order has no usable deposit address or amount')
    return { type: 'error', reason: 'lookupFailed' }
  }

  const asset =
    baseCurrency.metadata == null
      ? undefined
      : resolveMoonpayAsset(account, baseCurrency.metadata)
  if (asset == null || account.currencyConfig[asset.pluginId] == null) {
    console.warn(`MoonPay sell order asset is unknown: ${baseCurrency.code}`)
    return { type: 'error', reason: 'unknownAsset' }
  }

  // MoonPay sends an empty string when the network takes no tag:
  const rawTag = depositWallet?.walletAddressTag ?? ''
  const addressTag = rawTag.trim() === '' ? undefined : rawTag

  const { quoteCurrency, quoteCurrencyAmount } = order
  return {
    type: 'open',
    status,
    asset,
    depositAddress,
    addressTag,
    exchangeAmount: String(baseCurrencyAmount),
    fiatAmount:
      quoteCurrencyAmount == null ? undefined : String(quoteCurrencyAmount),
    fiatCurrencyCode: quoteCurrency?.code.toUpperCase()
  }
}

/** The page where MoonPay shows the user the state of a sell order. */
export const makeMoonpaySellReceiptUrl = (
  sellWidgetUrl: string,
  transactionId: string
): string =>
  `${sellWidgetUrl}/transaction_receipt?transactionId=${transactionId}`

export interface MoonpaySellActionParams {
  orderId: string
  /** The deposit amount, in the native units of the order's asset. */
  nativeAmount: string
  sellWidgetUrl: string
}

/**
 * Build the sell record to save on the deposit that pays an open order, so
 * the transaction reads as a MoonPay sell and not as a plain send.
 *
 * The fiat side is MoonPay's quote for the order, an estimate until it pays
 * out. An order with no quote gets no record: the deposit still goes out.
 */
export const makeMoonpaySellAction = (
  order: MoonpayOpenSellOrder,
  params: MoonpaySellActionParams
): EdgeTxActionFiat | undefined => {
  const { asset, depositAddress, fiatAmount, fiatCurrencyCode } = order
  const { orderId, nativeAmount, sellWidgetUrl } = params
  if (fiatAmount == null || fiatCurrencyCode == null || fiatCurrencyCode === '')
    return

  return {
    actionType: 'fiat',
    orderId,
    orderUri: makeMoonpaySellReceiptUrl(sellWidgetUrl, orderId),
    isEstimate: true,
    fiatPlugin: {
      providerId: MOONPAY_PROVIDER_ID,
      providerDisplayName: MOONPAY_DISPLAY_NAME,
      supportEmail: MOONPAY_SUPPORT_EMAIL
    },
    payinAddress: depositAddress,
    cryptoAsset: { ...asset, nativeAmount },
    fiatAsset: {
      fiatCurrencyCode: `iso:${fiatCurrencyCode}`,
      fiatAmount
    }
  }
}

/** Wrap a MoonPay deposit tag in the memo type its network expects. */
export const createMoonpayMemo = (
  pluginId: string,
  value: string
): EdgeMemo => {
  const memo: EdgeMemo = {
    type: 'text',
    value,
    hidden: true
  }

  switch (pluginId) {
    case 'ripple': {
      memo.type = 'number'
      memo.memoName = 'destination tag'
    }
  }
  return memo
}
