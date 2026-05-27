import {
  type BreezSdkInterface,
  connect,
  defaultConfig,
  Network,
  type Payment,
  PrepareSendPaymentRequest,
  type PrepareSendPaymentResponse,
  Seed,
  SendPaymentOptions,
  SendPaymentRequest
} from '@breeztech/breez-sdk-spark-react-native'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import RNFS from 'react-native-fs'

import { ENV } from '../../env'

/**
 * Bitcoin Lightning sends via the Breez SDK - Spark.
 *
 * Breez Spark is a self-custodial, "nodeless" Lightning wallet. We back it with
 * the host Bitcoin wallet's BIP39 mnemonic so the Lightning identity is derived
 * deterministically from the user's existing seed, and we keep each wallet's SDK
 * in its own storage directory keyed by walletId.
 *
 * NOTE: the Spark wallet manages its OWN balance/liquidity; it is not the same
 * UTXO set as the Edge bitcoin engine. Spending over Lightning requires the
 * Spark wallet to be funded (e.g. by depositing on-chain BTC to its deposit
 * address). Funding/receive flows are intentionally out of scope here — this
 * module only implements the send path.
 */

/** Bitcoin plugin id whose wallets we route Lightning sends through. */
export const BITCOIN_PLUGIN_ID = 'bitcoin'

// One live SDK connection per walletId. Connecting is expensive, so we cache the
// promise (not just the result) to coalesce concurrent callers.
const connections = new Map<string, Promise<BreezSdkInterface>>()

export class LightningConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LightningConfigError'
  }
}

/**
 * Returns true if `text` looks like a BOLT11 Lightning invoice (mainnet, testnet,
 * or regtest), with or without a `lightning:` URI scheme prefix.
 */
export function isLightningInvoice(text: string): boolean {
  const normalized = normalizeLightningInvoice(text).toLowerCase()
  return /^ln(bc|tb|bcrt)[0-9]/.test(normalized)
}

/** Strips a `lightning:` URI scheme prefix and surrounding whitespace. */
export function normalizeLightningInvoice(text: string): string {
  return text.trim().replace(/^lightning:/i, '')
}

/**
 * Connects (or returns the cached connection to) the Breez SDK for the given
 * bitcoin wallet. Throws `LightningConfigError` for predictable misconfigurations
 * (missing API key, unsupported wallet, non-mnemonic seed).
 */
export async function connectLightning(
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet
): Promise<BreezSdkInterface> {
  if (wallet.currencyInfo.pluginId !== BITCOIN_PLUGIN_ID) {
    throw new LightningConfigError(
      `Lightning sends are only supported for ${BITCOIN_PLUGIN_ID} wallets`
    )
  }

  const apiKey = ENV.BREEZ_API_KEY
  if (apiKey == null || apiKey === '') {
    throw new LightningConfigError('Missing BREEZ_API_KEY')
  }

  const cached = connections.get(wallet.id)
  if (cached != null) return await cached

  const connecting = (async (): Promise<BreezSdkInterface> => {
    const mnemonic = await account.getDisplayPrivateKey(wallet.id)
    // Breez Spark requires a BIP39 mnemonic. Edge bitcoin wallets created from a
    // seed phrase expose one here; imported single-key wallets do not.
    if (mnemonic == null || mnemonic.trim().split(/\s+/).length < 12) {
      throw new LightningConfigError(
        'This bitcoin wallet has no mnemonic seed and cannot back a Lightning wallet'
      )
    }

    const config = defaultConfig(Network.Mainnet)
    config.apiKey = apiKey

    const storageDir = `${RNFS.DocumentDirectoryPath}/breezSdkSpark/${wallet.id}`
    await RNFS.mkdir(storageDir).catch(() => {})

    const seed = new Seed.Mnemonic({
      mnemonic: mnemonic.trim(),
      passphrase: undefined
    })
    return await connect({ config, seed, storageDir })
  })()

  // Cache the in-flight promise; evict it if the connection ultimately fails so
  // a later attempt can retry from scratch.
  connections.set(wallet.id, connecting)
  connecting.catch(() => {
    connections.delete(wallet.id)
  })
  return await connecting
}

/**
 * Prepares a Lightning payment, returning Breez's fee/amount quote. We pass only
 * the invoice (no explicit amount), so this targets amount-bearing BOLT11
 * invoices — the common "paste an invoice" case. Amountless invoices would need
 * an explicit `amount` and are out of scope here.
 */
export async function prepareLightningSend(
  sdk: BreezSdkInterface,
  invoice: string
): Promise<PrepareSendPaymentResponse> {
  return await sdk.prepareSendPayment(
    PrepareSendPaymentRequest.create({ paymentRequest: invoice })
  )
}

/** Executes a previously prepared Lightning payment, returning the Payment. */
export async function confirmLightningSend(
  sdk: BreezSdkInterface,
  prepareResponse: PrepareSendPaymentResponse
): Promise<Payment> {
  const response = await sdk.sendPayment(
    SendPaymentRequest.create({
      prepareResponse,
      options: new SendPaymentOptions.Bolt11Invoice({
        preferSpark: false,
        completionTimeoutSecs: 60
      })
    })
  )
  return response.payment
}

/** Disconnects and forgets a wallet's SDK connection (e.g. on logout). */
export async function disconnectLightning(walletId: string): Promise<void> {
  const connecting = connections.get(walletId)
  if (connecting == null) return
  connections.delete(walletId)
  await connecting
    .then(async sdk => {
      await sdk.disconnect()
    })
    .catch(() => {})
}

/**
 * Pulls the uniffi error's structured detail (e.g. `SparkError.inner`) into a
 * flat string so error mapping can match on the actual underlying cause and
 * not just the variant name (the top-level `.message` is often just the
 * variant, e.g. `"SdkError.SparkError"`).
 */
function extractStructuredDetail(error: unknown): string {
  if (error == null || typeof error !== 'object') return ''
  const obj = error as Record<string, unknown>
  const parts: string[] = []
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (key === 'stack' || key === 'message') continue
    try {
      parts.push(String(JSON.stringify(obj[key])))
    } catch (_) {}
  }
  return parts.join(' ')
}

/**
 * Maps a raw SDK/connection error to a user-facing string. The Spark SDK does
 * not export typed error classes, so we match on message + structured detail
 * and fall back to a generic message.
 */
export function describeLightningError(error: unknown): string {
  if (error instanceof LightningConfigError) return error.message
  let message = 'Unknown error'
  if (error instanceof Error) message = error.message
  else if (typeof error === 'string') message = error
  const haystack = (
    message +
    ' ' +
    extractStructuredDetail(error)
  ).toLowerCase()
  // Spark "Tree service: insufficient funds" / leaf-arrangement errors look
  // like an insufficient-balance error but are actually a leaf-headroom issue —
  // the wallet has the funds, but the leaf tree can't yet be split to cover
  // `amount + fee`. Common on a freshly-claimed deposit before leaf
  // optimization runs. Distinguish it so we don't tell the user "insufficient
  // balance" when their balance is fine.
  if (haystack.includes('tree service') || haystack.includes('leaf')) {
    return 'Your Lightning balance is still settling — please wait a moment and try again, or send a smaller amount.'
  }
  if (haystack.includes('insufficient') || haystack.includes('liquidity')) {
    return 'Insufficient Lightning balance to pay this invoice'
  }
  if (haystack.includes('expired')) {
    return 'This Lightning invoice has expired'
  }
  if (haystack.includes('network') || haystack.includes('timeout')) {
    return 'Network error while sending the Lightning payment'
  }
  return message
}
