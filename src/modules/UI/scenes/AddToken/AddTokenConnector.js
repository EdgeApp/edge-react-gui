// @flow

import {connect} from 'react-redux'

// eslint-disable-next-line no-duplicate-imports
import {AddTokenComponent} from './AddToken.ui'
// eslint-disable-next-line no-duplicate-imports
import type {
  AddTokenOwnProps,
  AddTokenDispatchProps,
  AddTokenStateProps
} from './AddToken.ui.js'

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
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string): any =>
    dispatch(ADD_TOKEN_ACTIONS.addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination))
})

export default connect(mapStateToProps, mapDispatchToProps)(AddTokenComponent)
