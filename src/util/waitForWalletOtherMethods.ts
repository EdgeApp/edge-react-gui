import type { EdgeCurrencyWallet } from 'edge-core-js'

// Engine creation for a large account can take minutes on login,
// matching how long waitForAllWallets used to take before the wallet
// cache existed, so this is a safety valve rather than a deadline:
const OTHER_METHODS_TIMEOUT_MS = 10 * 60 * 1000

/**
 * Waits for a wallet's `otherMethods` to carry names.
 *
 * The core emits wallet objects before their engines exist. A cold
 * wallet's `otherMethods` is `{}` until its engine loads, so this wait
 * is what stops a caller from reaching for a method that is not there
 * yet. A warm wallet's is already populated with delegating stubs
 * built from the cached names, so this resolves immediately and the
 * stubs await the engine inside each call instead.
 *
 * Rejects after a timeout so a cold wallet whose engine never loads
 * cannot hang callers forever.
 */
export async function waitForWalletOtherMethods(
  wallet: EdgeCurrencyWallet,
  timeoutMs: number = OTHER_METHODS_TIMEOUT_MS
): Promise<void> {
  if (Object.keys(wallet.otherMethods).length > 0) return

  await new Promise<void>((resolve, reject) => {
    const handleReady = (): void => {
      clearTimeout(timeout)
      unsubscribe()
      resolve()
    }
    const timeout = setTimeout(() => {
      unsubscribe()
      reject(
        new Error(`Timed out waiting for wallet ${wallet.id} engine methods`)
      )
    }, timeoutMs)
    const unsubscribe = wallet.watch('otherMethods', otherMethods => {
      if (Object.keys(otherMethods).length > 0) handleReady()
    })

    // The methods may have arrived between the caller's check and the
    // subscription above, in which case the watcher never fires:
    if (Object.keys(wallet.otherMethods).length > 0) handleReady()
  })
}
