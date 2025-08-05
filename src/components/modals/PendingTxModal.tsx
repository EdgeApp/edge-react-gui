import type {
  EdgeCurrencyWallet,
  EdgeTokenId,
  EdgeTransaction
} from 'edge-core-js'
import * as React from 'react'
import type { AirshipBridge } from 'react-native-airship'

import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { NavigationBase } from '../../types/routerTypes'
import { ButtonsView } from '../buttons/ButtonsView'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { Paragraph } from '../themed/EdgeText'
import { EdgeModal } from './EdgeModal'

let isModalShowing = false

interface PendingTxModalProps {
  bridge: AirshipBridge<void>
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  navigation: NavigationBase
}

/**
 * Checks if a wallet is EVM-based by looking at its WalletConnect v2 chain ID namespace.
 * EVM chains use the 'eip155' namespace.
 */
function isEvmWallet(wallet: EdgeCurrencyWallet): boolean {
  const { pluginId } = wallet.currencyInfo
  const specialInfo = getSpecialCurrencyInfo(pluginId)
  return specialInfo.walletConnectV2ChainId?.namespace === 'eip155'
}

const PendingTxModal = (props: PendingTxModalProps): React.ReactElement => {
  const { bridge, wallet, navigation, tokenId } = props
  const [pendingTransaction, setPendingTransaction] =
    React.useState<EdgeTransaction | null>(null)

  const handleCancel = useHandler(() => {
    bridge.resolve()
  })

  // Helper function to check for pending transactions
  const checkPendingTransactions = React.useCallback(async (): Promise<
    EdgeTransaction[]
  > => {
    const transactions = await wallet.getTransactions({ tokenId })
    return transactions.filter(
      tx =>
        tx.confirmations === 'unconfirmed' ||
        (typeof tx.confirmations === 'number' && tx.confirmations === 0)
    )
  }, [wallet, tokenId])

  const handleGoToTransaction = useHandler(async () => {
    // Double-check for pending transactions before navigating
    try {
      const currentPendingTxs = await checkPendingTransactions()

      if (currentPendingTxs.length === 0) {
        // No more pending transactions, show success toast and dismiss
        bridge.resolve()
        showToast(lstrings.pending_transactions_confirmed)
        return
      }

      // Still have pending transactions, navigate to the oldest one
      if (pendingTransaction != null) {
        bridge.resolve()
        navigation.navigate('transactionDetails', {
          edgeTransaction: pendingTransaction,
          walletId: wallet.id
        })
      }
    } catch (error) {
      console.warn('Error checking pending transactions:', error)
      // Fallback to original behavior
      if (pendingTransaction != null) {
        bridge.resolve()
        navigation.navigate('transactionDetails', {
          edgeTransaction: pendingTransaction,
          walletId: wallet.id
        })
      }
    }
  })

  // Find the oldest pending transaction (which should have the lowest nonce in EVM)
  useAsyncEffect(
    async () => {
      try {
        const pendingTxs = await checkPendingTransactions()

        if (pendingTxs.length > 0) {
          // Sort by date (oldest first) to get the transaction with the lowest nonce
          // In EVM, transactions must be processed in nonce order, so the oldest pending
          // transaction is the one blocking all subsequent transactions
          const sortedPendingTxs = pendingTxs.sort((a, b) => a.date - b.date)
          setPendingTransaction(sortedPendingTxs[0])
        }
      } catch (error) {
        console.warn('Error fetching pending transactions:', error)
      }
    },
    [checkPendingTransactions],
    'PendingTxModal'
  )

  return (
    <EdgeModal
      bridge={bridge}
      title={lstrings.pending_transaction_modal_title}
      onCancel={handleCancel}
    >
      <Paragraph>{lstrings.pending_transaction_modal_message}</Paragraph>

      <ButtonsView
        primary={{
          label: lstrings.pending_transaction_modal_go_to_transaction,
          onPress: handleGoToTransaction,
          disabled: pendingTransaction == null
        }}
        layout="column"
      />
    </EdgeModal>
  )
}

/**
 * Shows the pending transaction modal only for EVM-based wallets.
 * For non-EVM wallets, this is a no-op.
 * Uses a mutex to prevent multiple instances.
 */
export async function showPendingTxModal(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId,
  navigation: NavigationBase
): Promise<void> {
  // Bail if we are currently showing the modal:
  if (isModalShowing) return

  // Only show the modal for EVM chains (identified by eip155 namespace)
  if (!isEvmWallet(wallet)) {
    return
  }

  isModalShowing = true

  try {
    await Airship.show(bridge => (
      <PendingTxModal
        bridge={bridge}
        tokenId={tokenId}
        wallet={wallet}
        navigation={navigation}
      />
    ))
  } catch (error) {
    showError(error)
  } finally {
    isModalShowing = false
  }
}
