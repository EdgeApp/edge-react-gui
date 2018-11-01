// @flow

import { connect } from 'react-redux'

// import * as Constants from '../../constants/indexConstants.js'
import { disableOtp, enableOtp } from '../../actions/OtpActions.js'
import OtpSettingsSceneComponent from '../../components/scenes/OtpSettingsScene.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'

export const mapStateToProps = (state: State) => {
  const isOtpEnabled = SETTINGS_SELECTORS.getIsOtpEnabled(state)
  const otpKey = SETTINGS_SELECTORS.getOtpKey(state)
  const otpResetDate = SETTINGS_SELECTORS.getOtpResetDate(state)
  return {
    isOtpEnabled,
    otpKey,
    otpResetDate
  }
}

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  enableOtp: () => dispatch(enableOtp()),
  disableOtp: () => dispatch(disableOtp())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OtpSettingsSceneComponent)
