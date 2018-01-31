// @flow

import type {State, Dispatch} from '../../../ReduxTypes'

import {getLoginStatus, getAutoLogoutTimeInSeconds} from '../../Settings/selectors'
import {logoutRequest} from '../../../Login/action'

import {connect} from 'react-redux'
import AutoLogout from './AutoLogout.ui.js'

const mapStateToProps = (state: State) => ({
  loginStatus: getLoginStatus(state),
  autoLogoutTimeInSeconds: getAutoLogoutTimeInSeconds(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  autoLogout: () => {
    return dispatch(logoutRequest())
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(AutoLogout)
