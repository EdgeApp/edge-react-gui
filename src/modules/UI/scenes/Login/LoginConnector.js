// @flow

import type {Dispatch, State} from '../../../ReduxTypes'

import {connect} from 'react-redux'

import Login from './Login.ui'
import * as CORE_SELECTORS from '../../../Core/selectors'
import {addUsernames} from '../../../Core/Context/action'
import {initializeAccount} from '../../../Login/action'

const mapStateToProps = (state: State) => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state),
  username: CORE_SELECTORS.getNextUsername(state),
  recoveryLogin: state.core.deepLinking.passwordRecoveryLink
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatch,
  addUsernames: (usernames) => dispatch(addUsernames(usernames)),
  initializeAccount: (account, touchIdInfo) => dispatch(initializeAccount(account, touchIdInfo))
})

export default connect(mapStateToProps, mapDispatchToProps)(Login)
