// @flow

import { connect } from 'react-redux'

import * as ADD_TOKEN_ACTIONS from '../../actions/AddTokenActions.js'
import type { AddTokenDispatchProps, AddTokenOwnProps, AddTokenStateProps } from '../../components/scenes/AddTokeScene.js'
import { AddToken } from '../../components/scenes/AddTokeScene.js'
import { getWallet } from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes.js'

const mapStateToProps = (state: State, ownProps: AddTokenOwnProps): AddTokenStateProps => ({
  addTokenPending: state.ui.wallets.addTokenPending,
  wallet: getWallet(state, ownProps.walletId)
})
const mapDispatchToProps = (dispatch: Dispatch): AddTokenDispatchProps => ({
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, walletType: string) => {
    dispatch(ADD_TOKEN_ACTIONS.addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination, walletType))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddToken)
