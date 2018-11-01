// @flow

import { connect } from 'react-redux'

import * as EDIT_TOKEN_ACTIONS from '../../actions/EditTokenActions.js'
import * as WALLET_ACTIONS from '../../actions/WalletActions'
import EditToken from '../../components/scenes/EditTokenScene'
import type { EditTokenDispatchProps, EditTokenStateProps } from '../../components/scenes/EditTokenScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'

const mapStateToProps = (state: State): EditTokenStateProps => ({
  customTokens: state.ui.settings.customTokens,
  deleteTokenModalVisible: state.ui.scenes.editToken.deleteTokenModalVisible,
  deleteCustomTokenProcessing: state.ui.scenes.editToken.deleteCustomTokenProcessing,
  editCustomTokenProcessing: state.ui.scenes.editToken.editCustomTokenProcessing
})
const mapDispatchToProps = (dispatch: Dispatch): EditTokenDispatchProps => ({
  showDeleteTokenModal: () => {
    dispatch(EDIT_TOKEN_ACTIONS.showDeleteTokenModal())
  },
  hideDeleteTokenModal: () => {
    dispatch(EDIT_TOKEN_ACTIONS.hideDeleteTokenModal())
  },
  deleteCustomToken: (walletId: string, currencyCode: string) => {
    dispatch(WALLET_ACTIONS.deleteCustomToken(walletId, currencyCode))
  },
  editCustomToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, oldCurrencyCode: string) => {
    dispatch(WALLET_ACTIONS.editCustomToken(walletId, currencyName, currencyCode, contractAddress, denomination, oldCurrencyCode))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditToken)
