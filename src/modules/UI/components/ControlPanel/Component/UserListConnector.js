// @flow

import {connect} from 'react-redux'
import _ from 'lodash'

import type {State, Dispatch} from '../../../../ReduxTypes'
import UserList from './UserList'
import {logoutRequest} from '../../../../Login/action'

import {getUsername, getUsernames} from '../../../../Core/selectors.js'

import {deleteLocalAccount} from '../action'

type StateProps = {usernames: Array<string>}
type DispatchProps = {
  logout: (username?: string) => void,
  deleteLocalAccount: (string) => void
}

const mapStateToProps = (state: State): StateProps => {
  const currentUsername = getUsername(state)
  const allUsernames = getUsernames(state)
  const usernames = _.filter(allUsernames, (username) => username !== currentUsername)
  return {
    usernames
  }
}
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  logout: (username) => { dispatch(logoutRequest(username)) },
  deleteLocalAccount: (username) => { dispatch(deleteLocalAccount(username)) }
})

export default connect(mapStateToProps, mapDispatchToProps)(UserList)
