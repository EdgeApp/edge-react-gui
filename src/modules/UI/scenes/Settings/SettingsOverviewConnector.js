// import HockeyApp from 'react-native-hockeyapp'
import {connect} from 'react-redux'
import {touchIdEnabled, supportsTouchId, enableTouchId} from 'airbitz-core-js-ui'
import SettingsOverview from './SettingsOverview.ui'

import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import * as CORE_SELECTORS from '../../../Core/selectors'
import {setAutoLogoutTimeInMinutesRequest} from './action'
import {sendLogs} from '../../../Logs/action'

const mapStateToProps = (state) => ({
  defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
  autoLogoutTimeInMinutes: SETTINGS_SELECTORS.getAutoLogoutTimeInMinutes(state),
  username: CORE_SELECTORS.getUsername(state),
  account : CORE_SELECTORS.getAccount(state),
  supportsTouchId: supportsTouchId(),
  touchIdEnabled: touchIdEnabled(CORE_SELECTORS.getAccount(state)),
})
const mapDispatchToProps = (dispatch) => ({
  setAutoLogoutTimeInMinutes: (autoLogoutTimeInMinutes) => dispatch(setAutoLogoutTimeInMinutesRequest(autoLogoutTimeInMinutes)),
  enableTouchId: (arg, account) => enableTouchId(arg, account),
  sendLogs: (text) => dispatch(sendLogs(text))
})

export default connect(mapStateToProps, mapDispatchToProps)(SettingsOverview)
