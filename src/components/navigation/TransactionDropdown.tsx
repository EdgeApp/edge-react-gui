import { EdgeTransaction } from 'edge-core-js/types'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { playReceiveSound } from '../../actions/SoundActions'
import { selectWallet } from '../../actions/WalletActions'
import s from '../../locales/strings'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors'
import { connect } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
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
  message: string
}

interface DispatchProps {
  selectWallet: (navigation: NavigationBase, walletId: string, currencyCode: string) => void
}

type Props = OwnProps & StateProps & DispatchProps

export function TransactionDropdown(props: Props) {
  const { bridge, message, tx, selectWallet, navigation } = props

  return (
    <FlashNotification
      bridge={bridge}
      onPress={() => {
        bridge.resolve()
        selectWallet(navigation, tx.walletId, tx.currencyCode)
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

    if (!state.ui.settings.loginStatus) {
      return { message: '' }
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
        message: sprintf(s.strings.bitcoin_received, `${symbol ? symbol + ' ' : ''}${displayAmount} ${name}`)
      }
    } else {
      return {
        message: sprintf(s.strings.bitcoin_received, currencyCode)
      }
    }
  },
  dispatch => ({
    selectWallet: (navigation: NavigationBase, walletId: string, currencyCode: string) => {
      dispatch(selectWallet(navigation, walletId, currencyCode))
    }
  })
)(TransactionDropdown)
