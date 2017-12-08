// @flow

import {connect} from 'react-redux'

import AddToken from './AddToken.ui'
import * as ADD_TOKEN_ACTIONS from './action.js'
import type {Dispatch, State} from '../../../ReduxTypes'

const mapStateToProps = (state: State) => ({
  addTokenPending: state.ui.wallets.addTokenPending
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatch,
  addToken: (walletId: string, tokenObj: Object) => dispatch(ADD_TOKEN_ACTIONS.addToken(walletId, tokenObj))
})

export default connect(mapStateToProps, mapDispatchToProps)(AddToken)
