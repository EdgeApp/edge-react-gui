// @flow

import { type EdgeTransaction } from 'edge-core-js/types'
import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { playReceiveSound } from '../../actions/SoundActions.js'
import { selectWallet } from '../../actions/WalletActions'
import { TRANSACTION_DETAILS } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import { convertNativeToDisplay } from '../../util/utils.js'
import { Airship } from '../services/AirshipInstance.js'
import { FlashNotification } from './FlashNotification.js'

let showing = false

export function showTransactionDropdown(tx: EdgeTransaction, walletId?: string) {
  if (!showing) {
    showing = true
    playReceiveSound().catch(error => console.log(error)) // Fail quietly
    Airship.show(bridge => <ConnectedTransactionDropdown bridge={bridge} tx={tx} walletId={walletId} />).then(() => {
      showing = false
    })
  }
}

type OwnProps = {
  bridge: AirshipBridge<void>,
  tx: EdgeTransaction,
  walletId?: string
}

type StateProps = {
  message: string
}

type DispatchProps = {
  selectWallet: (walletId: string, currencyCode: string) => void
}

type Props = OwnProps & StateProps & DispatchProps

export function TransactionDropdown(props: Props) {
  const { bridge, message, tx, walletId, selectWallet } = props

  return (
    <FlashNotification
      bridge={bridge}
      onPress={() => {
        bridge.resolve()
        walletId && selectWallet(walletId, tx.currencyCode)
        Actions.push(TRANSACTION_DETAILS, {
          edgeTransaction: tx
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
    const displayDenomination = getDisplayDenomination(state, currencyCode)
    const { symbol, name, multiplier } = displayDenomination
    const displayAmount = convertNativeToDisplay(multiplier)(nativeAmount)

    return {
      message: sprintf(s.strings.bitcoin_received, `${symbol ? symbol + ' ' : ''}${displayAmount} ${name}`)
    }
  },
  dispatch => ({
    selectWallet: (walletId: string, currencyCode: string) => {
      dispatch(selectWallet(walletId, currencyCode))
    }
  })
)(TransactionDropdown)
