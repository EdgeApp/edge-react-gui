import { ceil, mul } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import type { CtxSpendGiftCard } from './ctxSpendTypes'

/**
 * Mapping between a CTX payment quote and the Edge wallet that can pay it.
 *
 * CTX names the payment chain and network separately (`ETH` + `testnet`),
 * while Edge models each network as its own currency plugin, so the two have
 * to be reconciled before a wallet can be chosen.
 */

/** Edge plugin id for a CTX `paymentCryptoChain` + `paymentCryptoNetwork`. */
const CTX_CHAIN_TO_PLUGIN_ID: Record<string, Record<string, string>> = {
  ETH: { mainnet: 'ethereum', testnet: 'sepolia' }
}

/**
 * The Edge plugin that can pay this card, or `undefined` when Edge has no
 * wallet for that chain and network.
 *
 * Staging quotes every asset on testnet, and Edge only carries one testnet
 * currency plugin (sepolia), so on staging this resolves for ETH alone.
 */
export const getCtxPaymentPluginId = (
  giftCard: CtxSpendGiftCard
): string | undefined => {
  const { paymentCryptoChain, paymentCryptoNetwork } = giftCard
  if (paymentCryptoChain == null || paymentCryptoNetwork == null) {
    return undefined
  }
  return CTX_CHAIN_TO_PLUGIN_ID[paymentCryptoChain]?.[paymentCryptoNetwork]
}

/**
 * The account's first wallet for a plugin id, or `undefined` when the account
 * has none. The prototype pays from whichever wallet already exists rather
 * than creating one.
 */
export const findWalletByPluginId = (
  account: EdgeAccount,
  pluginId: string
): EdgeCurrencyWallet | undefined => {
  return Object.values(account.currencyWallets).find(
    wallet => wallet.currencyInfo.pluginId === pluginId
  )
}

/**
 * Convert a CTX `paymentCryptoAmount` (decimal units) to the native units a
 * spend target needs.
 *
 * Uses `biggystring` rather than float math: the quote carries twelve decimal
 * places and the wei conversion is eighteen more, which is well past what a
 * double represents exactly.
 */
export const getCtxPaymentNativeAmount = (
  giftCard: CtxSpendGiftCard,
  wallet: EdgeCurrencyWallet
): string => {
  const { paymentCryptoAmount } = giftCard
  if (paymentCryptoAmount == null) {
    throw new Error('CTX gift card has no payment amount')
  }
  const multiplier = wallet.currencyInfo.denominations[0]?.multiplier ?? '1'
  // The quote is exact and the address is single-use, so pay it verbatim.
  // `ceil` only guards a quote carrying more decimals than the chain has:
  // rounding down there would underpay and leave the card unfulfilled.
  return ceil(mul(paymentCryptoAmount, multiplier), 0)
}

/**
 * True once CTX has credited the payment.
 *
 * Observed against staging: `paymentStatus` goes `unpaid` to `paid` a couple
 * of minutes after the on-chain send, once the payment confirms.
 *
 * Fulfilment is a separate, slower track (`fulfilmentStatus` goes `pending` to
 * `ordered` and then on to the merchant issuing a code). Its terminal value
 * has not been observed, so there is deliberately no predicate for it here:
 * the scene shows `fulfilmentStatus` verbatim rather than a guessed boolean.
 */
export const isCtxGiftCardPaid = (giftCard: CtxSpendGiftCard): boolean =>
  giftCard.paymentStatus != null &&
  giftCard.paymentStatus !== 'unpaid' &&
  giftCard.paymentStatus !== 'pending'
