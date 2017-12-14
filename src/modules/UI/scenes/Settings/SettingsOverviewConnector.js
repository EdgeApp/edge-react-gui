// import HockeyApp from 'react-native-hockeyapp'
import {connect} from 'react-redux'
import {touchIdEnabled, supportsTouchId, enableTouchId} from 'airbitz-core-js-ui'
import SettingsOverview from './SettingsOverview.ui'

import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import * as CORE_SELECTORS from '../../../Core/selectors'
import {setAutoLogoutTimeInMinutesRequest, checkCurrentPassword, lockSettings} from './action'
import {sendLogs} from '../../../Logs/action'
import * as Constants from '../../../../constants/indexConstants'

//settings_button_lock_settings, or //settings_button_unlock_settings
const mapStateToProps = (state) => {
  const isLocked = SETTINGS_SELECTORS.getSettingsLock(state)
  const lockButtonIcon = isLocked ? Constants.LOCKED_ICON : Constants.UNLOCKED_ICON
  const lockButton = isLocked ? 'settings_button_unlock_settings' : 'settings_button_lock_settings'
  return {
    defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
    autoLogoutTimeInMinutes: SETTINGS_SELECTORS.getAutoLogoutTimeInMinutes(state),
    username: CORE_SELECTORS.getUsername(state),
    account : CORE_SELECTORS.getAccount(state),
    supportsTouchId: supportsTouchId(),
    touchIdEnabled: touchIdEnabled(CORE_SELECTORS.getAccount(state)),
    lockButton,
    lockButtonIcon,
    isLocked
  }
}
const mapDispatchToProps = (dispatch) => ({
  setAutoLogoutTimeInMinutes: (autoLogoutTimeInMinutes) => dispatch(setAutoLogoutTimeInMinutesRequest(autoLogoutTimeInMinutes)),
  confirmPassword: (arg) => dispatch(checkCurrentPassword(arg)),
  lockSettings: () => dispatch(lockSettings()),
  enableTouchId: (arg, account) => enableTouchId(arg, account),
  sendLogs: (text) => dispatch(sendLogs(text))
})

export default connect(mapStateToProps, mapDispatchToProps)(SettingsOverview)
