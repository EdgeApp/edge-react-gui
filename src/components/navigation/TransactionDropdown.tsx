import { EdgeAccount, EdgeTransaction } from 'edge-core-js/types'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { playReceiveSound } from '../../actions/SoundActions'
import { selectWalletToken } from '../../actions/WalletActions'
import s from '../../locales/strings'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors'
import { connect } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { convertNativeToDisplay } from '../../util/utils'
import { Airship } from '../services/AirshipInstance'
import { FlashNotification } from './FlashNotification'

let showing = false

export function showTransactionDropdown(navigation: NavigationBase, tx: EdgeTransaction) {
  if (!showing) {
    showing = true
    playReceiveSound().catch(error => console.log(error)) // Fail quietly
    Airship.show(bridge => <ConnectedTransactionDropdown bridge={bridge} navigation={navigation} tx={tx} />).then(() => {
      showing = false
    })
  }
}

interface OwnProps {
  navigation: NavigationBase
  bridge: AirshipBridge<void>
  tx: EdgeTransaction
}

interface StateProps {
  account: EdgeAccount
  message: string
}

interface DispatchProps {
  selectWalletToken: (navigation: NavigationBase, walletId: string, tokenId?: string) => void
}

type Props = OwnProps & StateProps & DispatchProps

export function TransactionDropdown(props: Props) {
  const { account, bridge, message, tx, selectWalletToken, navigation } = props
  const wallet = account.currencyWallets[tx.walletId]
  const tokenId = getTokenId(account, wallet.currencyInfo.pluginId, tx.currencyCode)

  return (
    <FlashNotification
      bridge={bridge}
      onPress={() => {
        bridge.resolve()
        selectWalletToken(navigation, tx.walletId, tokenId)
        navigation.navigate('transactionDetails', {
          edgeTransaction: tx,
          walletId: tx.walletId
        })
      }}
      message={message}
    />
  )
}

const ConnectedTransactionDropdown = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => {
    const { tx } = ownProps
    const { account } = state.core

    if (!state.ui.settings.loginStatus) {
      return { account, message: '' }
    }

    const { nativeAmount, currencyCode } = tx
    const wallet = state.core.account.currencyWallets[tx.walletId]
    // wallet and walletId are both optional and if neither are present we can't show an amount with a denomination.
    // In that case we can still show a message with the currency code
    if (wallet != null) {
      const displayDenomination = getDisplayDenomination(state, wallet.currencyInfo.pluginId, currencyCode)
      const { symbol, name, multiplier } = displayDenomination
      const displayAmount = convertNativeToDisplay(multiplier)(nativeAmount)
      return {
        account,
        message: sprintf(s.strings.bitcoin_received, `${symbol ? symbol + ' ' : ''}${displayAmount} ${name}`)
      }
    } else {
      return {
        account,
        message: sprintf(s.strings.bitcoin_received, currencyCode)
      }
    }
  },
  dispatch => ({
    selectWalletToken: (navigation: NavigationBase, walletId: string, tokenId?: string) => {
      dispatch(selectWalletToken({ navigation, walletId, tokenId }))
    }
  })
)(TransactionDropdown)
