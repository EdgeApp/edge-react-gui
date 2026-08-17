import type { EdgeCurrencyWallet, EdgeSwapRequest } from 'edge-core-js'

/**
 * The destination wallet of a wallet-to-wallet swap request.
 *
 * `EdgeSwapRequest.toWallet` became optional when swap-to-address arrived, but
 * only that flow omits it and that flow has its own scenes, so every
 * wallet-to-wallet surface needs the same narrowing before it can read the
 * destination. Six copies of this guard had already drifted into two different
 * messages; one helper keeps the narrowing, the message and the reason for
 * both in one place.
 */
export function requireDestinationWallet(
  request: EdgeSwapRequest
): EdgeCurrencyWallet {
  const { toWallet } = request
  if (toWallet == null) {
    throw new Error('Swap request is missing a destination wallet')
  }
  return toWallet
}
