// @flow

import {connect} from 'react-redux'
import * as EDIT_TOKEN_ACTIONS from './action.js'
// eslint-disable-next-line no-duplicate-imports
import EditToken from './EditToken.ui'
// eslint-disable-next-line no-duplicate-imports
import type {
  EditTokenStateProps,
  EditTokenDispatchProps,
  EditTokenOwnProps
} from './EditToken.ui.js'
import * as WALLET_ACTIONS from '../../Wallets/action'
import type {Dispatch, State} from '../../../ReduxTypes'

const mapStateToProps = (state: State): EditTokenStateProps => ({
  customTokens: state.ui.settings.customTokens,
  deleteTokenModalVisible: state.ui.scenes.editToken.deleteTokenModalVisible,
  deleteCustomTokenProcessing: state.ui.scenes.editToken.deleteCustomTokenProcessing,
  editCustomTokenProcessing: state.ui.scenes.editToken.editCustomTokenProcessing
})
const mapDispatchToProps = (dispatch: Dispatch): EditTokenDispatchProps => ({
  showDeleteTokenModal: (): any => dispatch(EDIT_TOKEN_ACTIONS.showDeleteTokenModal()),
  hideDeleteTokenModal: (): any => dispatch(EDIT_TOKEN_ACTIONS.hideDeleteTokenModal()),
  deleteCustomToken: (walletId: string, currencyCode: string): any => dispatch(WALLET_ACTIONS.deleteCustomToken(walletId, currencyCode)),
  editCustomToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, oldCurrencyCode: string): any =>
    dispatch(WALLET_ACTIONS.editCustomToken(walletId, currencyName, currencyCode, contractAddress, denomination, oldCurrencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(EditToken)
