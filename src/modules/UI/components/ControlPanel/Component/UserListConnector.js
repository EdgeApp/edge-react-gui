// @flow

import { type Disklet } from 'disklet'
import { type EdgeContext } from 'edge-core-js'
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../types/reduxTypes.js'
import * as CORE_SELECTORS from '../../../../Core/selectors.js'
import { logoutRequest } from '../../../../Login/action'
import { deleteLocalAccount } from '../action'
import UserList from './UserList'

type StateProps = {
  context: EdgeContext,
  disklet: Disklet,
  currentUsername: string
}
type DispatchProps = {
  logout: (username?: string) => void,
  deleteLocalAccount: string => void
}

const mapStateToProps = (state: State): StateProps => {
  return {
    context: CORE_SELECTORS.getContext(state),
    disklet: state.core.disklet,
    currentUsername: CORE_SELECTORS.getUsername(state)
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
