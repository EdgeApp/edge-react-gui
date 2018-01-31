// @flow

import type {Dispatch, State} from '../../../ReduxTypes'

import {connect} from 'react-redux'

import Login from './Login.ui'
import {getContext, getAccount, getNextUsername} from '../../../Core/selectors'
import {addUsernames} from '../../../Core/Context/action'
import {initializeAccount} from '../../../Login/action'

const mapStateToProps = (state: State) => ({
  context: getContext(state),
  account: getAccount(state),
  username: getNextUsername(state),
  recoveryLogin: state.core.deepLinking.passwordRecoveryLink
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatch,
  addUsernames: (usernames) => dispatch(addUsernames(usernames)),
  initializeAccount: (account, touchIdInfo) => dispatch(initializeAccount(account, touchIdInfo))
})

export default connect(mapStateToProps, mapDispatchToProps)(Login)
