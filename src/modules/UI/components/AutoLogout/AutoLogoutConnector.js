// @flow

import { connect } from 'react-redux'

import { logoutRequest } from '../../../Login/action'
import type { Dispatch, State } from '../../../ReduxTypes'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AutoLogout)
