// @flow

import {connect} from 'react-redux'

import * as EDIT_TOKEN_ACTIONS from './action.js'
import EditToken, {
  type EditTokenStateProps,
  type EditTokenDispatchProps
} from './EditToken.ui'
import * as WALLET_ACTIONS from '../../Wallets/action'
import type {Dispatch, State} from '../../../ReduxTypes'
import {getCustomTokens} from '../../Settings/selectors.js'
import {
  getDeleteTokenModalVisible,
  getDeleteCustomTokenProcessing,
  getEditCustomTokenProcessing
} from './selectors.js'

const mapStateToProps = (state: State): EditTokenStateProps => ({
  customTokens: getCustomTokens(state),
  deleteTokenModalVisible: getDeleteTokenModalVisible(state),
  deleteCustomTokenProcessing: getDeleteCustomTokenProcessing(state),
  editCustomTokenProcessing: getEditCustomTokenProcessing(state)
})
const mapDispatchToProps = (dispatch: Dispatch): EditTokenDispatchProps => ({
  showDeleteTokenModal: () => { dispatch(EDIT_TOKEN_ACTIONS.showDeleteTokenModal()) },
  hideDeleteTokenModal: () => { dispatch(EDIT_TOKEN_ACTIONS.hideDeleteTokenModal()) },
  deleteCustomToken: (walletId: string, currencyCode: string) => { dispatch(WALLET_ACTIONS.deleteCustomToken(walletId, currencyCode)) },
  editCustomToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, oldCurrencyCode: string) => {
    dispatch(WALLET_ACTIONS.editCustomToken(walletId, currencyName, currencyCode, contractAddress, denomination, oldCurrencyCode))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(EditToken)
