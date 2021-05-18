// @flow

import { connect } from 'react-redux'

import * as ADD_TOKEN_ACTIONS from '../../actions/AddTokenActions.js'
import type { AddTokenDispatchProps, AddTokenOwnProps, AddTokenStateProps } from '../../components/scenes/AddTokenScene.js'
import { AddToken } from '../../components/scenes/AddTokenScene.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'

const mapStateToProps = (state: RootState, ownProps: AddTokenOwnProps): AddTokenStateProps => ({
  addTokenPending: state.ui.wallets.addTokenPending,
  wallet: state.ui.wallets.byId[ownProps.walletId]
})
const mapDispatchToProps = (dispatch: Dispatch): AddTokenDispatchProps => ({
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, walletType: string) => {
    dispatch(ADD_TOKEN_ACTIONS.addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination, walletType))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(AddToken)
