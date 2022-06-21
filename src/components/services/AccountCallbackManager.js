// @flow

import { type EdgeAccount, type EdgeCurrencyWallet } from 'edge-core-js'
import { watchSecurityAlerts } from 'edge-login-ui-rn'
import * as React from 'react'

import { updateExchangeRates } from '../../actions/ExchangeRateActions.js'
import { checkPasswordRecovery } from '../../actions/RecoveryReminderActions.js'
import { newTransactionsRequest, refreshTransactionsRequest } from '../../actions/TransactionListActions.js'
import { updateWalletLoadingProgress, updateWalletsRequest } from '../../actions/WalletActions.js'
import { useAsyncEffect } from '../../hooks/useAsyncEffect.js'
import { useWalletsSubscriber } from '../../hooks/useWalletsSubscriber.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useDispatch } from '../../types/reactRedux.js'
import { type NavigationProp, useNavigation } from '../../types/routerTypes.js'
import { isReceivedTransaction, snooze } from '../../util/utils.js'
import { WcSmartContractModal } from '../modals/WcSmartContractModal.js'
import { Airship } from './AirshipInstance.js'

type Props = {
  account: EdgeAccount
}

// Tracks items that need a refresh:
type DirtyList = {
  rates: boolean,
  walletList: boolean,
  wallets: { [walletId: string]: EdgeCurrencyWallet }
}

const notDirty: DirtyList = {
  rates: false,
  walletList: false,
  wallets: {}
}

export function AccountCallbackManager(props: Props) {
  const { account } = props
  const dispatch = useDispatch()
  const [dirty, setDirty] = useState<DirtyList>(notDirty)
  const navigation: NavigationProp<'edge'> = useNavigation()

  // Helper for marking wallets dirty:
  function addWallet(wallet: EdgeCurrencyWallet) {
    setDirty(dirty => ({
      ...dirty,
      rates: true, // We might reconsider this behavior
      wallets: { ...dirty.wallets, [wallet.id]: wallet }
    }))
  }

  // Subscribe to the account:
  useEffect(() => {
    const cleanups = [
      account.watch('currencyWallets', () =>
        setDirty(dirty => ({
          ...dirty,
          walletList: true
        }))
      ),

      account.watch('loggedIn', () => {
        if (account.loggedIn === false) {
          Airship.clear()
          console.log('onLoggedOut')
        }
      }),

      watchSecurityAlerts(account, hasAlerts => {
        if (hasAlerts && navigation.currentScene !== 'securityAlerts') {
          navigation.push('securityAlerts')
        }
      }),

      account.rateCache.on('update', () =>
        setDirty(dirty => ({
          ...dirty,
          rates: true
        }))
      )
    ]

    return () => cleanups.forEach(cleanup => cleanup())
  }, [account])

  // Subscribe to each wallet that comes online:
  useWalletsSubscriber(account, wallet => {
    const cleanups = [
      wallet.watch('syncRatio', ratio => {
        dispatch(updateWalletLoadingProgress(wallet.id, ratio))
      }),

      wallet.on('newTransactions', transactions => {
        console.log(`${walletPrefix(wallet)}: onNewTransactions: ${transactions.map(tx => tx.txid).join(' ')}`)

        dispatch(refreshTransactionsRequest(wallet.id, transactions))
        dispatch(newTransactionsRequest(wallet.id, transactions))
        addWallet(wallet)

        // Check if password recovery is set up:
        const finalTxIndex = transactions.length - 1
        if (isReceivedTransaction(transactions[finalTxIndex])) {
          dispatch(checkPasswordRecovery())
        }
      }),

      wallet.on('transactionsChanged', transactions => {
        console.log(`${walletPrefix(wallet)}: onTransactionsChanged: ${transactions.map(tx => tx.txid).join(' ')}`)

        dispatch(refreshTransactionsRequest(wallet.id, transactions))
        addWallet(wallet)
      }),

      wallet.on('wcNewContractCall', obj => {
        const { dApp, payload, uri, walletId } = obj
        if (walletId == null) return
        Airship.show(bridge => <WcSmartContractModal bridge={bridge} walletId={walletId} dApp={dApp} payload={payload} uri={uri} />)
      }),

      // These ones defer their work until later:
      wallet.watch('balances', () => addWallet(wallet)),
      wallet.watch('enabledTokenIds', () => addWallet(wallet)),
      wallet.watch('name', () => addWallet(wallet))
    ]

    return () => cleanups.forEach(cleanup => cleanup())
  })

  // Do the expensive work with rate limiting:
  useAsyncEffect(async () => {
    setDirty(notDirty)

    // Update wallets:
    const walletIds = Object.keys(dirty.wallets)
    if (dirty.walletList) {
      // Update all wallets (hammer mode):
      console.log('Updating wallet list')
      await dispatch(updateWalletsRequest())
      await snooze(1000)
    } else if (walletIds.length > 0) {
      // Update individual wallets:
      console.log(`Updating wallets: ${walletIds.map(id => walletPrefix(dirty.wallets[id])).join(' ')}`)
      dispatch({
        type: 'UI/WALLETS/UPSERT_WALLETS',
        data: {
          wallets: walletIds.map(id => dirty.wallets[id])
        }
      })
      await snooze(1000)
    }

    // Update exchange rates:
    if (dirty.rates) {
      console.log('Updating exchange rates')
      await dispatch(updateExchangeRates())
      await snooze(1000)
    }
  }, [dirty])

  return null
}

function walletPrefix(wallet: EdgeCurrencyWallet): string {
  return `${wallet.currencyInfo.currencyCode}-${wallet.id.slice(0, 2)}`
}
