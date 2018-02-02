// @flow

import {connect} from 'react-redux'

import Main from './Main'
import {logoutRequest} from '../../../../Login/action'
import type {State, Dispatch} from '../../../../ReduxTypes'

import {getUsersView} from '../selectors.js'

const mapStateToProps = (state: State) => ({
  usersView: getUsersView(state)
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  logout: (username?: string) => dispatch(logoutRequest(username))
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
