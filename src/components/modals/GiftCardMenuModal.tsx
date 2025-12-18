import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import type { PhazeDisplayOrder } from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useSelector } from '../../types/reactRedux'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { UnscaledText } from '../text/UnscaledText'
import { EdgeModal } from './EdgeModal'

export type GiftCardMenuResult =
  | { type: 'goToTransaction'; transaction: EdgeTransaction; walletId: string }
  | { type: 'markAsRedeemed' }
  | undefined

interface Props {
  bridge: AirshipBridge<GiftCardMenuResult>
  order: PhazeDisplayOrder
}

interface MenuOption {
  key: string
  label: string
  icon: string
  disabled: boolean
  loading: boolean
}

export const GiftCardMenuModal: React.FC<Props> = props => {
  const { bridge, order } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const [isLoadingTx, setIsLoadingTx] = React.useState(false)
  const [transaction, setTransaction] = React.useState<EdgeTransaction | null>(
    null
  )
  const [txSearchComplete, setTxSearchComplete] = React.useState(false)

  // Get wallet and check sync status
  const wallet: EdgeCurrencyWallet | undefined =
    order.walletId != null ? currencyWallets[order.walletId] : undefined
  const isSynced = wallet?.syncRatio === 1

  // Look up the transaction when modal opens
  React.useEffect(() => {
    const findTransaction = async (): Promise<void> => {
      if (wallet == null || order.txid == null) {
        setTxSearchComplete(true)
        return
      }

      setIsLoadingTx(true)
      try {
        const txs = await wallet.getTransactions({
          tokenId: order.tokenId ?? null
        })
        const tx = txs.find(t => t.txid === order.txid)
        setTransaction(tx ?? null)
      } catch {
        // Transaction lookup failed
        setTransaction(null)
      } finally {
        setIsLoadingTx(false)
        setTxSearchComplete(true)
      }
    }

    findTransaction().catch(() => {})
  }, [wallet, order.txid, order.tokenId])

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })

  const handleGoToTransaction = useHandler(() => {
    if (transaction != null && order.walletId != null) {
      bridge.resolve({
        type: 'goToTransaction',
        transaction,
        walletId: order.walletId
      })
    }
  })

  const handleMarkAsRedeemed = useHandler(() => {
    bridge.resolve({ type: 'markAsRedeemed' })
  })

  // Build menu options
  const options: MenuOption[] = React.useMemo(() => {
    const hasTx = transaction != null
    const canNavigate = hasTx && order.walletId != null

    // "Go to Transaction" state:
    // - Loading: while searching for tx (show spinner)
    // - Disabled + grayed: wallet synced but no tx found
    // - Enabled: tx found
    const goToTxDisabled = !canNavigate && (isSynced || txSearchComplete)
    const goToTxLoading = isLoadingTx || (!txSearchComplete && !isSynced)

    return [
      {
        key: 'goToTransaction',
        label: lstrings.gift_card_go_to_transaction,
        icon: 'arrowright',
        disabled: goToTxDisabled,
        loading: goToTxLoading
      },
      {
        key: 'markAsRedeemed',
        label: lstrings.gift_card_mark_as_redeemed,
        icon: 'check',
        disabled: false,
        loading: false
      }
    ]
  }, [transaction, order.walletId, isSynced, isLoadingTx, txSearchComplete])

  return (
    <EdgeModal
      bridge={bridge}
      title={order.brandName}
      onCancel={handleCancel}
      scroll
    >
      {options.map(option => {
        const handlePress =
          option.key === 'goToTransaction'
            ? handleGoToTransaction
            : handleMarkAsRedeemed

        return (
          <EdgeTouchableOpacity
            key={option.key}
            onPress={handlePress}
            style={option.disabled ? [styles.row, styles.disabled] : styles.row}
            disabled={option.disabled || option.loading}
          >
            {option.loading ? (
              <ActivityIndicator
                size="small"
                color={theme.primaryText}
                style={styles.optionIcon}
              />
            ) : (
              <AntDesignIcon
                name={option.icon}
                size={theme.rem(1)}
                style={styles.optionIcon}
              />
            )}
            <UnscaledText
              style={[styles.optionText, option.disabled && styles.disabled]}
            >
              {option.label}
            </UnscaledText>
          </EdgeTouchableOpacity>
        )
      })}
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  disabled: {
    opacity: 0.5
  },
  optionIcon: {
    color: theme.primaryText,
    margin: theme.rem(0.5)
  },
  optionText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    margin: theme.rem(0.5)
  }
}))
