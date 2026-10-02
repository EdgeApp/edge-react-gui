import {
  asEither,
  asNull,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'
import type { EdgeAccount, EdgeMemo, EdgeTxActionFiat } from 'edge-core-js'
import { v4 } from 'uuid'

import type { EdgeAsset } from '../../../types/types'
import { runWithTimeout } from '../../../util/utils'
import { getRampPluginStoreId } from '../utils/rampStoreIds'
import { resolveMoonpayAsset } from './moonpayAssetUtils'
import { asMetadata } from './moonpayRampTypes'

export const MOONPAY_PROVIDER_ID = 'moonpay'
export const MOONPAY_DISPLAY_NAME = 'MoonPay'
export const MOONPAY_SUPPORT_EMAIL = 'support@moonpay.com'

/** The one sell status where MoonPay is still waiting for the crypto. */
const MOONPAY_SELL_STATUS_OPEN = 'waitingForDeposit'

/** Sell statuses where MoonPay already has the deposit. */
const MOONPAY_SELL_STATUSES_PAID = ['pending', 'completed']

/**
 * MoonPay's synced data store, the one both the ramp plugin and the legacy
 * fiat provider are handed. Each `externalTransactionId` a sell widget was
 * opened with is an item here, named by `makeSellOrderItemId`.
 */
const MOONPAY_STORE_ID = getRampPluginStoreId(MOONPAY_PROVIDER_ID)

/** How long a sell link waits on `account.sync()` before giving up. */
const SELL_ORDER_SYNC_TIMEOUT_MS = 10000

const makeSellOrderItemId = (externalTransactionId: string): string =>
  `sellOrder:${externalTransactionId}`

/** The part of a plugin's data store that saving an id needs. */
interface MoonpayStoreWriter {
  readonly setItem: (itemId: string, value: string) => Promise<void>
}

// Cleaner for MoonPay GET /v3/sell_transactions/:id response
const asMoonpaySellTransaction = asObject({
  status: asString,
  baseCurrencyAmount: asNumber,
  externalTransactionId: asOptional(asEither(asString, asNull)),
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
  /** MoonPay already has the deposit, and is paying or has paid out. */
  | { type: 'paid'; status: string }
  /** The order exists but no longer takes a deposit. */
  | { type: 'notOpen'; status: string }
  /**
   * The order could not be read or checked, was not opened from this
   * account, or names an asset Edge cannot pin down.
   */
  | {
      type: 'error'
      reason: 'lookupFailed' | 'notFound' | 'notOwned' | 'unknownAsset'
    }

/**
 * Make the `externalTransactionId` for a sell widget about to open, and save
 * it to MoonPay's store so `fetchMoonpaySellOrder` accepts the order it
 * creates. MoonPay returns the id with the order, and nobody else can know
 * it, so it proves the order was started from this account. `store` must be
 * the plugin's store for MoonPay, which both sell flows are handed.
 */
export const makeMoonpayExternalTransactionId = async (
  store: MoonpayStoreWriter
): Promise<string> => {
  const externalTransactionId = v4()
  await store.setItem(
    makeSellOrderItemId(externalTransactionId),
    JSON.stringify({ created: new Date().toISOString() })
  )
  return externalTransactionId
}

const hasSellOrderItem = async (
  account: EdgeAccount,
  itemId: string
): Promise<boolean> => {
  try {
    await account.dataStore.getItem(MOONPAY_STORE_ID, itemId)
    return true
  } catch (error: unknown) {
    return false
  }
}

/**
 * Whether this account saved `externalTransactionId`. `unknown` means the
 * sync this needed failed or took too long, so the order may still be ours.
 */
const checkExternalTransactionId = async (
  account: EdgeAccount,
  externalTransactionId: string | null | undefined
): Promise<'owned' | 'notOwned' | 'unknown'> => {
  if (externalTransactionId == null || externalTransactionId === '')
    return 'notOwned'
  const itemId = makeSellOrderItemId(externalTransactionId)
  if (await hasSellOrderItem(account, itemId)) return 'owned'

  // The sell may have started on another device whose save has not synced
  // here yet. Core waits 30 to 60 s after a resume before its first sync,
  // and the link usually opens the app from the background, so sync now.
  // The sync client sets no request timeout, so bound the wait here:
  try {
    await runWithTimeout(account.sync(), SELL_ORDER_SYNC_TIMEOUT_MS)
  } catch (error: unknown) {
    console.warn(`MoonPay sell order account sync failed: ${String(error)}`)
    return 'unknown'
  }
  return (await hasSellOrderItem(account, itemId)) ? 'owned' : 'notOwned'
}

/**
 * Look a MoonPay sell order up by id and report what, if anything, the user
 * still owes it.
 *
 * A "Send with Edge" link carries the deposit address, amount and currency in
 * a URL anybody can write, and names the currency by a ticker that several
 * networks share. The order itself is the authority, so every value in the
 * result comes from MoonPay's response and none from the link. The order id
 * alone proves nothing, since anyone can open a sell and share its id, so an
 * order counts only when it carries an `externalTransactionId` this account
 * saved with `makeMoonpayExternalTransactionId`. Never throws: a failure of
 * any kind is an `error` result, and the caller sends nothing.
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

  const ownership = await checkExternalTransactionId(
    account,
    order.externalTransactionId
  )
  if (ownership === 'unknown') return { type: 'error', reason: 'lookupFailed' }
  if (ownership === 'notOwned') return { type: 'error', reason: 'notOwned' }

  const { status } = order
  if (MOONPAY_SELL_STATUSES_PAID.includes(status))
    return { type: 'paid', status }
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
