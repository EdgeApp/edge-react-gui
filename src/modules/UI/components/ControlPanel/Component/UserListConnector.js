// @flow

import _ from 'lodash'
import { connect } from 'react-redux'

import * as CORE_SELECTORS from '../../../../Core/selectors.js'
import { logoutRequest } from '../../../../Login/action'
import type { Dispatch, State } from '../../../../ReduxTypes'
import { deleteLocalAccount } from '../action'
import UserList from './UserList'

type StateProps = { usernames: Array<string> }
type DispatchProps = {
  logout: (username?: string) => void,
  deleteLocalAccount: string => void
}

const mapStateToProps = (state: State): StateProps => {
  const currentUsername = CORE_SELECTORS.getUsername(state)
  const allUsernames = CORE_SELECTORS.getUsernames(state)
  const usernames = _.filter(allUsernames, username => username !== currentUsername)
  return {
    usernames
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

export default connect(mapStateToProps, mapDispatchToProps)(UserList)
