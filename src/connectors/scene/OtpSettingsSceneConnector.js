// @flow
import {connect} from 'react-redux'
import type {Dispatch, State} from '../../modules/ReduxTypes'
import * as SETTINGS_SELECTORS from '../../modules/UI/Settings/selectors.js'
import OtpSettingsSceneComponent from '../../modules/UI/scenes/Otp/OtpSettingsSceneComponent.js'
// import * as Constants from '../../constants/indexConstants.js'
import {enableOtp, disableOtp} from '../../actions/indexActions.js'
export const mapStateToProps = (state: State) => ({
  isOtpEnabled: SETTINGS_SELECTORS.getIsOtpEnabled(state),
  otpKey: SETTINGS_SELECTORS.getOtpKey(state)
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  enableOtp: () => dispatch(enableOtp()),
  disableOtp: () => dispatch(disableOtp())
})

export default connect(mapStateToProps, mapDispatchToProps)(OtpSettingsSceneComponent)
