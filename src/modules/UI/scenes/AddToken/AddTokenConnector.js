// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes'
import { getWallet } from '../../selectors'
import * as ADD_TOKEN_ACTIONS from './action.js'
import { AddToken } from './AddToken.ui'
import type { AddTokenDispatchProps, AddTokenOwnProps, AddTokenStateProps } from './AddToken.ui'

const mapStateToProps = (state: State, ownProps: AddTokenOwnProps): AddTokenStateProps => ({
  addTokenPending: state.ui.wallets.addTokenPending,
  wallet: getWallet(state, ownProps.walletId)
})
const mapDispatchToProps = (dispatch: Dispatch): AddTokenDispatchProps => ({
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string) => {
    dispatch(ADD_TOKEN_ACTIONS.addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddToken)
