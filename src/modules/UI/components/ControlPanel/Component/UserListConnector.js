// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../types/reduxTypes.js'
import * as CORE_SELECTORS from '../../../../Core/selectors.js'
import { logoutRequest } from '../../../../Login/action'
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
  const folder = CORE_SELECTORS.getFolder(state)

  return {
    currentUsername,
    allUsernames,
    folder
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
