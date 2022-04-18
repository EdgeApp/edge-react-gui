// @flow

import { type EdgeAccount, type EdgeCurrencyWallet } from 'edge-core-js'

import { useEffect, useRef } from '../types/reactHooks.js'

type Cleanup = void | (() => void)

type WalletMap = { [walletId: string]: EdgeCurrencyWallet }
type State = {
  cleanups: Map<string, Cleanup>,
  lastWallets: WalletMap,
  subscribe: (wallet: EdgeCurrencyWallet) => Cleanup
}

/**
 * Maintains subscriptions to all wallets in an account.
 *
 * This hook will capture the callback passed on first render,
 * and then use that for all subsequent subscriptions.
 * We do this because wallets come and go on their own time,
 * quite independently from when your component renders.
 * This means you can update `useState` values,
 * but they will always be stale if you try to read them in here.
 */
export function useWalletsSubscriber(account: EdgeAccount, subscribe: (wallet: EdgeCurrencyWallet) => Cleanup): void {
  const state = useRef<State>({
    cleanups: new Map(),
    lastWallets: {},

    // We expect this callback to change on each render,
    // so capture the the initial value and keep using that:
    subscribe
  })

  useEffect(() => {
    function update(wallets: WalletMap) {
      const { cleanups, lastWallets, subscribe } = state.current

      cleanups.forEach((cleanup, walletId) => {
        if (cleanup != null && wallets[walletId] !== lastWallets[walletId]) {
          cleanup()
          cleanups.set(walletId, undefined)
        }
      })

      for (const walletId of Object.keys(wallets)) {
        const wallet = wallets[walletId]
        if (wallet != null && wallets[walletId] !== lastWallets[walletId]) {
          cleanups.set(walletId, subscribe(wallet))
        }
      }
      state.current.lastWallets = wallets
    }

    const cleanup = account.watch('currencyWallets', update)
    update(account.currencyWallets)

    return () => {
      update({})
      cleanup()
    }
  }, [
    // Yes, we want to resubscribe if the account changes:
    account
  ])
}
