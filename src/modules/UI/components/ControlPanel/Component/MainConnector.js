// @flow

import {connect} from 'react-redux'
import Main from './Main'
import {logoutRequest} from '../../../../Login/action'
import type {State, Dispatch} from '../../../../ReduxTypes'

const mapStateToProps = (state: State) => ({
  usersView: state.ui.scenes.controlPanel.usersView
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  logout: (username?: string) => dispatch(logoutRequest(username))
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
