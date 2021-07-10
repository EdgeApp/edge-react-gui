// @flow

import { type EdgeAccount, type EdgeContext, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { connect } from 'react-redux'

import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { showError } from './AirshipInstance.js'

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext,
  guiWallets: { [walletId: string]: GuiWallet }
}
type Props = StateProps

/**
 * Tracks the state of a booting wallet.
 */
type WalletBoot = {
  close(): void,
  complete: boolean,
  walletId: string
}

/**
 * Responsible for pausing & un-pausing wallets.
 */
export class WalletLifecycleComponent extends React.Component<Props> {
  // Core & related subscriptions:
  edgeAccount: EdgeAccount
  edgeContext: EdgeContext
  cleanups: Array<() => void> = []

  // Wallet booting state:
  booting: WalletBoot[] = []
  paused: boolean = false

  /**
   * Forgets about any booting wallets.
   */
  cancelBoot() {
    for (const boot of this.booting) boot.close()
    this.booting = []
  }

  /**
   * Unsubscribes from the account & context callbacks.
   */
  unsubscribe() {
    for (const cleanup of this.cleanups) cleanup()
    this.cleanups = []
  }

  /**
   * Figures out what has changed and adapts.
   */
  handleChange = () => {
    const { account, context, guiWallets } = this.props

    // Check for login / logout:
    if (account !== this.edgeAccount || context !== this.edgeContext) {
      this.cancelBoot()
      this.unsubscribe()

      // Only subscribe if we are logged in:
      if (typeof account.watch === 'function' && typeof context.watch === 'function') {
        this.cleanups = [
          account.watch('activeWalletIds', this.handleChange),
          account.watch('currencyWallets', this.handleChange),
          context.watch('paused', this.handleChange)
        ]
      }
    }
    this.edgeAccount = account
    this.edgeContext = context

    // Grab the mutable core state:
    const { paused } = context
    const { activeWalletIds, currencyWallets } = account

    // If we have become paused, shut down all wallets:
    if (paused && !this.paused) {
      this.cancelBoot()
      Promise.all(Object.keys(currencyWallets).map(walletId => currencyWallets[walletId].changePaused(true))).catch(showError)
    }
    this.paused = paused

    // The next steps only apply if we are active:
    if (paused) return

    // Check for boots that have completed, and for deleted wallets:
    this.booting = this.booting.filter(boot => {
      const { complete, walletId } = boot
      if (complete) return false

      const wallet = currencyWallets[walletId]
      if (wallet == null || guiWallets[walletId] == null) {
        boot.close()
        return false
      }

      return true
    })

    // If the booting list has < 3 items, boot some wallets:
    for (const walletId of activeWalletIds) {
      if (this.booting.length >= 3) break

      // Ignore missing wallets, started wallets, and already-booting wallets:
      const wallet = currencyWallets[walletId]
      if (wallet == null || guiWallets[walletId] == null) continue
      if (!wallet.paused) continue
      if (this.booting.find(boot => boot.walletId === walletId) != null) continue

      this.booting.push(bootWallet(wallet, this.handleChange))
    }
  }

  componentDidMount() {
    this.handleChange()
  }

  componentDidUpdate() {
    this.handleChange()
  }

  componentWillUnmount() {
    this.cancelBoot()
    this.unsubscribe()
  }

  render(): React.Node {
    return null
  }
}

/**
 * Un-pause a wallet, and then call the callback once the wallet syncs.
 * Returns an object that can be used to monitor the status
 * or cancel the callback.
 */
function bootWallet(wallet: EdgeCurrencyWallet, onBoot: () => void): WalletBoot {
  let cleanup: void | (() => void)
  let timeoutId: void | TimeoutID

  const out: WalletBoot = {
    close() {
      if (out.complete) return
      if (timeoutId != null) clearTimeout(timeoutId)
      if (cleanup != null) cleanup()
      out.complete = true
    },
    complete: false,
    walletId: wallet.id
  }

  // Start the wallet, then wait for it to sync or time out:
  wallet
    .changePaused(false)
    .then(() => {
      // Check the already-closed and already-synced cases:
      if (out.complete) return
      if (wallet.syncRatio >= 1) {
        onBoot()
        out.close()
        return
      }

      cleanup = wallet.watch('syncRatio', ratio => {
        if (ratio < 1) return
        if (!out.complete) onBoot()
        out.close()
      })

      timeoutId = setTimeout(() => {
        timeoutId = undefined
        if (!out.complete) onBoot()
        out.close()
      }, 5000)
    })
    .catch(showError)

  return out
}

export const WalletLifecycle = connect(
  (state: RootState): StateProps => ({
    account: state.core.account,
    context: state.core.context,
    guiWallets: state.ui.wallets.byId
  }),
  (dispatch: Dispatch) => ({})
)(WalletLifecycleComponent)
