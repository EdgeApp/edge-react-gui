import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import type { PhazeDisplayOrder } from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useSelector } from '../../types/reactRedux'
import { ArrowRightIcon, CheckIcon, QuestionIcon } from '../icons/ThemedIcons'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SelectableRow } from '../themed/SelectableRow'
import { EdgeModal } from './EdgeModal'

export type GiftCardMenuResult =
  | { type: 'goToTransaction'; transaction: EdgeTransaction; walletId: string }
  | { type: 'markAsRedeemed' }
  | { type: 'unmarkAsRedeemed' }
  | { type: 'getHelp' }
  | undefined

interface Props {
  bridge: AirshipBridge<GiftCardMenuResult>
  order: PhazeDisplayOrder
  isRedeemed?: boolean
}

export const GiftCardMenuModal: React.FC<Props> = props => {
  const { bridge, order, isRedeemed = false } = props
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

  const handleToggleRedeemed = useHandler(() => {
    bridge.resolve({
      type: isRedeemed ? 'unmarkAsRedeemed' : 'markAsRedeemed'
    })
  })

  const handleGetHelp = useHandler(() => {
    bridge.resolve({ type: 'getHelp' })
  })

  // Determine "Go to Transaction" state
  const hasTx = transaction != null
  const canNavigate = hasTx && order.walletId != null
  const goToTxDisabled = !canNavigate && (isSynced || txSearchComplete)
  const goToTxLoading = isLoadingTx || (!txSearchComplete && !isSynced)

  const iconSize = theme.rem(1.5)
  const iconColor = theme.iconTappable

  // Disable entire row when loading or tx unavailable
  const txRowDisabled = goToTxLoading || goToTxDisabled

  return (
    <EdgeModal bridge={bridge} title={order.brandName} onCancel={handleCancel}>
      <EdgeText style={styles.quoteIdText} numberOfLines={1}>
        {sprintf(lstrings.gift_card_quote_id_label_1s, order.quoteId)}
      </EdgeText>
      <SelectableRow
        marginRem={0.5}
        title={lstrings.gift_card_go_to_transaction}
        onPress={txRowDisabled ? undefined : handleGoToTransaction}
        icon={
          goToTxLoading ? (
            <View style={styles.iconContainer}>
              <ActivityIndicator size="small" color={iconColor} />
            </View>
          ) : (
            <View style={styles.iconContainer}>
              <ArrowRightIcon size={iconSize} color={iconColor} />
            </View>
          )
        }
      />
      <SelectableRow
        marginRem={0.5}
        title={
          isRedeemed
            ? lstrings.gift_card_unmark_as_redeemed
            : lstrings.gift_card_mark_as_redeemed
        }
        onPress={handleToggleRedeemed}
        icon={
          <View style={styles.iconContainer}>
            <CheckIcon size={iconSize} color={iconColor} />
          </View>
        }
      />
      <SelectableRow
        title={lstrings.gift_card_get_help}
        onPress={handleGetHelp}
        icon={
          <View style={styles.iconContainer}>
            <QuestionIcon size={iconSize} color={iconColor} />
          </View>
        }
      />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  quoteIdText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    marginHorizontal: theme.rem(0.5),
    marginBottom: theme.rem(0.5)
  },
  iconContainer: {
    width: theme.rem(2.5),
    height: theme.rem(2.5),
    alignItems: 'center',
    justifyContent: 'center'
  }
}))
