// @flow

import { type EdgeTransaction } from 'edge-core-js/types'
import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { Actions } from 'react-native-router-flux'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { playReceiveSound } from '../../actions/SoundActions.js'
import s from '../../locales/strings.js'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors.js'
import { nightText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { connect } from '../../types/reactRedux.js'
import { convertNativeToDisplay } from '../../util/utils.js'
import { AirshipDropdown } from '../common/AirshipDropdown.js'
import { Airship } from '../services/AirshipInstance.js'

let showing = false

export function showTransactionDropdown(tx: EdgeTransaction) {
  if (!showing) {
    showing = true
    playReceiveSound().catch(error => console.log(error)) // Fail quietly
    Airship.show(bridge => <ConnectedTransactionDropdown bridge={bridge} tx={tx} />).then(() => {
      showing = false
    })
  }
}

type OwnProps = {
  bridge: AirshipBridge<void>,
  tx: EdgeTransaction
}

type StateProps = {
  message: string
}

type Props = OwnProps & StateProps

export function TransactionDropdown(props: Props) {
  const { bridge, message, tx } = props

  return (
    <AirshipDropdown
      bridge={bridge}
      backgroundColor={THEME.COLORS.PRIMARY}
      onPress={() => {
        bridge.resolve()
        Actions.transactionDetails({ edgeTransaction: tx })
      }}
    >
      <AntDesignIcon name="checkcircle" size={THEME.rem(2)} style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </AirshipDropdown>
  )
}

const padding = THEME.rem(1 / 4)

const styles = StyleSheet.create({
  icon: {
    alignSelf: 'center',
    color: THEME.COLORS.ACCENT_MINT,
    paddingTop: padding
  },

  text: {
    ...nightText('row-center'),
    padding
  }
})

const ConnectedTransactionDropdown = connect<StateProps, {}, OwnProps>(
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
  dispatch => ({})
)(TransactionDropdown)
