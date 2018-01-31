// @flow
// import HockeyApp from 'react-native-hockeyapp'
import {connect} from 'react-redux'

import SettingsOverview from './SettingsOverview.ui'
import {
  getSettingsLock,
  getIsTouchIdSupported,
  getIsTouchIdEnabled,
  getDefaultFiat,
  getAutoLogoutTimeInMinutes
} from '../../Settings/selectors'
import {
  getAccount,
  getUsername
} from '../../../Core/selectors'
import {setAutoLogoutTimeInMinutesRequest,
  checkCurrentPassword,
  lockSettings,
  updateTouchIdEnabled} from './action'
import {sendLogs} from '../../../Logs/action'
import * as Constants from '../../../../constants/indexConstants'

import type {State, Dispatch} from '../../../../modules/ReduxTypes'
import type { AbcAccount } from 'edge-login'

const mapStateToProps = (state: State) => {
  const isLocked = getSettingsLock(state)
  const lockButtonIcon = isLocked ? Constants.LOCKED_ICON : Constants.UNLOCKED_ICON
  const lockButton = isLocked ? 'settings_button_unlock_settings' : 'settings_button_lock_settings'
  const account = getAccount(state)
  const isTouchIdSupported = getIsTouchIdSupported(state)
  const isTouchIdEnabled = getIsTouchIdEnabled(state)
  return {
    defaultFiat: getDefaultFiat(state),
    autoLogoutTimeInMinutes: getAutoLogoutTimeInMinutes(state),
    username: getUsername(state),
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
