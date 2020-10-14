// @flow

import { connect } from 'react-redux'

import { type Dispatch, type RootState } from '../../../../../types/reduxTypes.js'
import { logoutRequest } from '../../../../Login/action'
import Main from './Main'

const mapStateToProps = (state: RootState) => ({
  usersView: state.ui.scenes.controlPanel.usersView
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  logout: (username?: string) => dispatch(logoutRequest(username))
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
