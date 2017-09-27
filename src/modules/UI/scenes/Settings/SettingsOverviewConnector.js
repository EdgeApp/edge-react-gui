// import HockeyApp from 'react-native-hockeyapp'
import {connect} from 'react-redux'
import SettingsOverview from './SettingsOverview.ui'

import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import * as CORE_SELECTORS from '../../../Core/selectors'
import {setAutoLogoutTimeInMinutesRequest} from './action'

const mapStateToProps = (state) => ({
  defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
  autoLogoutTimeInMinutes: SETTINGS_SELECTORS.getAutoLogoutTimeInMinutes(state),
  username: CORE_SELECTORS.getUsername(state)
})
const mapDispatchToProps = (dispatch) => ({
  setAutoLogoutTimeInMinutes: (autoLogoutTimeInMinutes) => dispatch(setAutoLogoutTimeInMinutesRequest(autoLogoutTimeInMinutes))
})

export default connect(mapStateToProps, mapDispatchToProps)(SettingsOverview)
