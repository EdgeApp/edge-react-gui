// @flow

import type {State, Dispatch} from '../../../ReduxTypes'

import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import {logoutRequest} from '../../../Login/action'

import {connect} from 'react-redux'
import AutoLogout from './AutoLogout.ui.js'

const mapStateToProps = (state: State) => ({
  loginStatus: SETTINGS_SELECTORS.getLoginStatus(state),
  autoLogoutTimeInSeconds: SETTINGS_SELECTORS.getAutoLogoutTimeInSeconds(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  autoLogout: () => {
    return dispatch(logoutRequest())
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(AutoLogout)
