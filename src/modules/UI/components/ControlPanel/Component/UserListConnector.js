// @flow

import { connect } from 'react-redux'

import * as CORE_SELECTORS from '../../../../Core/selectors.js'
import { logoutRequest } from '../../../../Login/action'
import type { Dispatch, State } from '../../../../ReduxTypes'
import { deleteLocalAccount } from '../action'
import UserList from './UserList'

type StateProps = {
  allUsernames: Array<string>,
  currentUsername: string
}
type DispatchProps = {
  logout: (username?: string) => void,
  deleteLocalAccount: string => void
}

const mapStateToProps = (state: State): StateProps => {
  const currentUsername = CORE_SELECTORS.getUsername(state)
  const allUsernames = CORE_SELECTORS.getUsernames(state)
  return {
    currentUsername,
    allUsernames
  }
}
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  logout: username => {
    dispatch(logoutRequest(username))
  },
  deleteLocalAccount: username => {
    dispatch(deleteLocalAccount(username))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserList)
