// @flow
// import HockeyApp from 'react-native-hockeyapp'
import {connect} from 'react-redux'
import SettingsOverview from './SettingsOverview.ui'

import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import * as CORE_SELECTORS from '../../../Core/selectors'
import {setAutoLogoutTimeInMinutesRequest,
  checkCurrentPassword,
  lockSettings,
  updateTouchIdEnabled} from './action'
import {sendLogs} from '../../../Logs/action'
import * as Constants from '../../../../constants/indexConstants'
import type {State, Dispatch} from '../../../../modules/ReduxTypes'
import type { AbcAccount } from 'edge-login'
// settings_button_lock_settings, or //settings_button_unlock_settings
const mapStateToProps = (state: State) => {
  const isLocked = SETTINGS_SELECTORS.getSettingsLock(state)
  const lockButtonIcon = isLocked ? Constants.LOCKED_ICON : Constants.UNLOCKED_ICON
  const lockButton = isLocked ? 'settings_button_unlock_settings' : 'settings_button_lock_settings'
  const account = CORE_SELECTORS.getAccount(state)
  const isTouchIdSupported = SETTINGS_SELECTORS.getIsTouchIdSupported(state)
  const isTouchIdEnabled = SETTINGS_SELECTORS.getIsTouchIdEnabled(state)
  return {
    defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
    autoLogoutTimeInMinutes: SETTINGS_SELECTORS.getAutoLogoutTimeInMinutes(state),
    username: CORE_SELECTORS.getUsername(state),
    account,
    supportsTouchId: isTouchIdSupported,
    touchIdEnabled: isTouchIdEnabled,
    lockButton,
    lockButtonIcon,
    isLocked
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  setAutoLogoutTimeInMinutes: (autoLogoutTimeInMinutes: number) => dispatch(setAutoLogoutTimeInMinutesRequest(autoLogoutTimeInMinutes)),
  confirmPassword: (arg: string) => dispatch(checkCurrentPassword(arg)),
  lockSettings: () => dispatch(lockSettings()),
  dispatchUpdateEnableTouchIdEnable: (arg: boolean, account: AbcAccount) => dispatch(updateTouchIdEnabled(arg, account)),
  sendLogs: (text: string) => dispatch(sendLogs(text))
})

export default connect(mapStateToProps, mapDispatchToProps)(SettingsOverview)
