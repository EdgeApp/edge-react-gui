// @flow

import type { EdgeAccount } from 'edge-core-js'
import { connect } from 'react-redux'

import * as actions from '../../../../actions/indexActions.js'
import * as Constants from '../../../../constants/indexConstants'
import type { Dispatch, State } from '../../../../modules/ReduxTypes'
import * as CORE_SELECTORS from '../../../Core/selectors'
import { resetSendLogsStatus, sendLogs } from '../../../Logs/action'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import { checkCurrentPassword, lockSettings, restoreWallets, setAutoLogoutTimeInMinutesRequest, togglePinLoginEnabled, updateTouchIdEnabled } from './action'
import SettingsOverview from './SettingsOverview.ui'

// settings_button_lock_settings, or //settings_button_unlock_settings

const mapStateToProps = (state: State) => {
  const isLocked = SETTINGS_SELECTORS.getSettingsLock(state)
  const lockButtonIcon = isLocked ? Constants.LOCKED_ICON : Constants.UNLOCKED_ICON
  const lockButton = isLocked ? 'settings_button_unlock_settings' : 'settings_button_lock_settings'
  const account = CORE_SELECTORS.getAccount(state)
  const isTouchIdSupported = SETTINGS_SELECTORS.getIsTouchIdSupported(state)
  const isTouchIdEnabled = SETTINGS_SELECTORS.getIsTouchIdEnabled(state)
  const confirmPasswordError = SETTINGS_SELECTORS.getConfirmPasswordErrorMessage(state)
  const sendLogsStatus = SETTINGS_SELECTORS.getSendLogsStatus(state)
  const pinLoginEnabled = SETTINGS_SELECTORS.getPinLoginEnabled(state)
  return {
    defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
    autoLogoutTimeInMinutes: SETTINGS_SELECTORS.getAutoLogoutTimeInMinutes(state),
    username: CORE_SELECTORS.getUsername(state),
    account,
    supportsTouchId: isTouchIdSupported,
    touchIdEnabled: isTouchIdEnabled,
    lockButton,
    lockButtonIcon,
    isLocked,
    confirmPasswordError,
    sendLogsStatus,
    pinLoginEnabled
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  setAutoLogoutTimeInMinutes: (autoLogoutTimeInMinutes: number) => dispatch(setAutoLogoutTimeInMinutesRequest(autoLogoutTimeInMinutes)),
  confirmPassword: (arg: string) => dispatch(checkCurrentPassword(arg)),
  lockSettings: () => dispatch(lockSettings()),
  dispatchUpdateEnableTouchIdEnable: (arg: boolean, account: EdgeAccount) => dispatch(updateTouchIdEnabled(arg, account)),
  sendLogs: (text: string) => dispatch(sendLogs(text)),
  resetConfirmPasswordError: (arg: Object) => dispatch(actions.dispatchActionObject(Constants.SET_CONFIRM_PASSWORD_ERROR, arg)),
  resetSendLogsStatus: () => dispatch(resetSendLogsStatus()),
  onTogglePinLoginEnabled: (enableLogin: boolean) => dispatch(togglePinLoginEnabled(enableLogin)),
  onConfirmRestoreWallets: () => dispatch(restoreWallets())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SettingsOverview)
