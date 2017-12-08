// @flow

import {connect} from 'react-redux'

import type {State, Dispatch} from '../../../../ReduxTypes'
import UserList from './UserList'
import {logoutRequest} from '../../../../Login/action'

import * as CORE_SELECTORS from '../../../../Core/selectors.js'
import * as CONTEXT_API from '../../../../Core/Context/api.js'

type StateProps = {usernames: Array<string>}
type DispatchProps = {
  logout: (username?: string) => void,
  deleteLocalAccount: (string) => void
}

const mapStateToProps = (state: State): StateProps => ({
  usernames: CORE_SELECTORS.getUsernames(state)
})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  logout: (username) => { dispatch(logoutRequest(username)) },
  deleteLocalAccount: (username) => { dispatch(CONTEXT_API.deleteLocalAccount(username)) }
})

export default connect(mapStateToProps, mapDispatchToProps)(UserList)
