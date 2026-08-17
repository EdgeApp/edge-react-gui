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

/**
 * Edge plugin id for a CTX `paymentCryptoChain` + `paymentCryptoNetwork`.
 *
 * The chain codes are the ones the server actually returns, read back from a
 * `POST /gift-cards` response per currency rather than taken from a currency
 * list. Every mainnet chain here is one Edge ships a plugin for; `sepolia` is
 * the only testnet plugin Edge carries, which is why the testnet column is
 * otherwise empty even though staging quotes all of these on testnet.
 */
const CTX_CHAIN_TO_PLUGIN_ID: Record<string, Record<string, string>> = {
  BCH: { mainnet: 'bitcoincash' },
  BTC: { mainnet: 'bitcoin' },
  DASH: { mainnet: 'dash' },
  ETH: { mainnet: 'ethereum', testnet: 'sepolia' },
  LTC: { mainnet: 'litecoin' },
  XLM: { mainnet: 'stellar' },
  XMR: { mainnet: 'monero' },
  ZANO: { mainnet: 'zano' },
  ZEC: { mainnet: 'zcash' }
}

/**
 * True when the quote is payable in the chain's own native asset.
 *
 * CTX names a token quote by splitting the pair: `paymentCryptoChain` stays
 * `ETH` while `paymentCryptoCurrency` becomes `ETH.USDC`, and the payment URI
 * is an ERC-20 transfer rather than a plain send. Both the wallet lookup and
 * the native-amount conversion below key off the chain alone, so a token quote
 * that reached them would be paid in the chain's native asset at the token's
 * decimal count: a 0.01 USDC quote would send 0.01 ETH. Reject it here instead.
 */
export const isCtxNativePayment = (giftCard: CtxSpendGiftCard): boolean => {
  const { paymentCryptoChain, paymentCryptoCurrency } = giftCard
  return (
    paymentCryptoChain != null &&
    paymentCryptoCurrency != null &&
    paymentCryptoChain === paymentCryptoCurrency
  )
}

/**
 * The Edge plugin that can pay this card, or `undefined` when Edge has no
 * wallet for that chain and network.
 *
 * Staging quotes every asset on testnet, and Edge only carries one testnet
 * currency plugin (sepolia), so on staging this resolves for ETH alone. On
 * production every chain in the table above resolves.
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
 * This is the payment half only. Whether the merchant went on to issue a code
 * is the display status below, which runs on its own slower track.
 */
export const isCtxGiftCardPaid = (giftCard: CtxSpendGiftCard): boolean =>
  giftCard.paymentStatus != null &&
  giftCard.paymentStatus !== 'unpaid' &&
  giftCard.paymentStatus !== 'pending'

/**
 * The card's rolled-up status, which is the track CTX's documented state
 * machine describes. `displayStatus` is the presentation form of `status`;
 * every response carries both, so the fallback only guards a trimmed payload.
 */
const getCtxGiftCardDisplayStatus = (
  giftCard: CtxSpendGiftCard
): string | undefined => giftCard.displayStatus ?? giftCard.status

/**
 * True once the merchant has issued the card. This is the success end state.
 *
 * The full state machine, per CTX: `unpaid`, `paid`, `fulfilled`
 * (terminal success), `rejected` (which can still move on to `refunded`), and
 * `refunded` (terminal). An earlier revision of this file guessed at
 * `fulfilled`/`complete` and was deleted rather than shipped on a guess.
 */
export const isCtxGiftCardFulfilled = (giftCard: CtxSpendGiftCard): boolean =>
  getCtxGiftCardDisplayStatus(giftCard) === 'fulfilled'

/**
 * True when the order failed. `rejected` is not an end state on its own: CTX
 * can still move a rejected card to `refunded`, so both read as failed while
 * only one of them stops the poll.
 */
export const isCtxGiftCardFailed = (giftCard: CtxSpendGiftCard): boolean => {
  const status = getCtxGiftCardDisplayStatus(giftCard)
  return status === 'rejected' || status === 'refunded'
}

/**
 * True once the card can no longer change, which is what stops the poll.
 *
 * Only `fulfilled` and `refunded` are terminal. `rejected` deliberately is
 * not, because a rejected card is still waiting on its refund.
 */
export const isCtxGiftCardTerminal = (giftCard: CtxSpendGiftCard): boolean => {
  const status = getCtxGiftCardDisplayStatus(giftCard)
  return status === 'fulfilled' || status === 'refunded'
}
