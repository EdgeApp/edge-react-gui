// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { CHANGE_MINING_FEE_SEND_CONFIRMATION } from '../../../../constants/indexConstants'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import { openHelpModal } from '../../components/HelpModal/actions.js'
import { updateMaxSpend } from './action'
import { activated } from './components/UniqueIdentifierModal/UniqueIdentifierModalActions.js'
import SendConfirmationOptions from './SendConfirmationOptions'

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
  openHelpModal: () => dispatch(openHelpModal()),
  sendMaxSpend: () => dispatch(updateMaxSpend()),
  uniqueIdentifierModalActivated: () => dispatch(activated())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SendConfirmationOptions)
