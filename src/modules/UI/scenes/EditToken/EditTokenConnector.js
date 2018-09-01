// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes'
import * as WALLET_ACTIONS from '../../Wallets/action'
import * as EDIT_TOKEN_ACTIONS from './action.js'
import EditToken from './EditToken.ui'
import type { EditTokenDispatchProps, EditTokenStateProps } from './EditToken.ui'

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
