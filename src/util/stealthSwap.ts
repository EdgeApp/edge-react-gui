import type { EdgeCurrencyWallet, EdgeSwapRequest } from 'edge-core-js'

/**
 * The destination wallet of a wallet-to-wallet swap request.
 *
 * `EdgeSwapRequest.toWallet` is optional because a swap-to-address request
 * omits it, and that flow has its own scenes, so every wallet-to-wallet surface
 * needs the same narrowing before it can read the destination. One helper keeps
 * the narrowing and its message in one place.
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
