// @flow

import { connect } from 'react-redux'

import Login from '../../components/scenes/LoginScene'
import * as CORE_SELECTORS from '../../modules/Core/selectors'
import { initializeAccount } from '../../modules/Login/action'
import type { Dispatch, State } from '../../modules/ReduxTypes'

const mapStateToProps = (state: State) => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state),
  username: CORE_SELECTORS.getNextUsername(state),
  recoveryLogin: state.core.deepLinking.passwordRecoveryLink
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  dispatch,
  addUsernames: usernames =>
    dispatch({
      type: 'CORE/CONTEXT/ADD_USERNAMES',
      data: { usernames }
    }),
  initializeAccount: (account, touchIdInfo) => dispatch(initializeAccount(account, touchIdInfo))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login)
