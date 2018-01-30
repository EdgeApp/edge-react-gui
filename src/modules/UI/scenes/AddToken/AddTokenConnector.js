// @flow

import {connect} from 'react-redux'
import {AddToken,
  type AddTokenOwnProps,
  type AddTokenDispatchProps,
  type AddTokenStateProps}
from './AddToken.ui'

import * as ADD_TOKEN_ACTIONS from './action.js'
import {
  getWallet
} from '../../selectors'
import type {Dispatch, State} from '../../../ReduxTypes'

const mapStateToProps = (state: State, ownProps: AddTokenOwnProps): AddTokenStateProps => ({
  addTokenPending: state.ui.wallets.addTokenPending,
  wallet: getWallet(state, ownProps.walletId)
})
const mapDispatchToProps = (dispatch: Dispatch): AddTokenDispatchProps => ({
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string) => {
    dispatch(ADD_TOKEN_ACTIONS.addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(AddToken)
