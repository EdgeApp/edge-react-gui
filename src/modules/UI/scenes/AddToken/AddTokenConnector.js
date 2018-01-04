// @flow

import {connect} from 'react-redux'

import AddToken from './AddToken.ui'
import * as ADD_TOKEN_ACTIONS from './action.js'
import {
  getWallet
} from '../../selectors'
import type {Dispatch, State} from '../../../ReduxTypes'

const mapStateToProps = (state: State, ownProps: any) => ({
  addTokenPending: state.ui.wallets.addTokenPending,
  wallet: getWallet(state, ownProps.walletId)
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatch,
  addNewToken: (walletId: string, tokenObj: Object) => dispatch(ADD_TOKEN_ACTIONS.addNewToken(walletId, tokenObj))
})

export default connect(mapStateToProps, mapDispatchToProps)(AddToken)
