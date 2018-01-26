// @flow

import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'

import TransactionAlert from './TransactionAlert.ui'
import {dismissTransactionAlert} from './actions.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import * as UTILS from '../../../utils'

import type {State, Dispatch} from '../../../ReduxTypes'

const mapStateToProps = (state: State) => {
  const abcTransaction = state.ui.transactionAlert.abcTransaction
  const displayAlert = state.ui.transactionAlert.displayAlert
  if (!displayAlert || !abcTransaction) return {}

  const {nativeAmount, currencyCode} = abcTransaction
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode || 'ETH')
  // $FlowFixMe
  const {symbol: displaySymbol, name: displayName, multiplier: displayMultiplier} = displayDenomination
  const displayAmount = UTILS.convertNativeToDisplay(displayMultiplier)(nativeAmount)
  const viewTransaction = () => Actions.transactionDetails({abcTransaction})

  return {
    displayAlert,
    displayName,
    displayAmount,
    displaySymbol,
    viewTransaction
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  dismissAlert: () => dispatch(dismissTransactionAlert())
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionAlert)
