// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { updateMaxSpend } from '../actions/SendConfirmationActions'
import { activated } from '../actions/UniqueIdentifierModalActions.js'
import SendConfirmationOptions from '../components/common/SendConfirmationOptions'
import { CHANGE_MINING_FEE_SEND_CONFIRMATION } from '../constants/indexConstants'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import type { Dispatch, State } from '../types/reduxTypes.js'

const mapStateToProps = (state: State) => {
  const sourceWalletId = state.ui.wallets.selectedWalletId
  const currencyCode = state.ui.wallets.selectedCurrencyCode
  const isEditable = state.ui.scenes.sendConfirmation.isEditable

  return {
    sourceWallet: CORE_SELECTORS.getWallet(state, sourceWalletId),
    currencyCode,
    isEditable
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  changeMiningFee: sourceWallet => Actions[CHANGE_MINING_FEE_SEND_CONFIRMATION]({ sourceWallet }),
  sendMaxSpend: () => dispatch(updateMaxSpend()),
  uniqueIdentifierModalActivated: () => dispatch(activated())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SendConfirmationOptions)
