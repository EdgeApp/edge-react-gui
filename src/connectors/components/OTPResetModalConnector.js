// @flow

import { connect } from 'react-redux'

import iconImage from '../../../../assets/images/otp/OTP-badge_sm.png'
import { disableOtp, keepOtp } from '../../actions/OtpActions'
import s from '../../locales/strings.js'
import type { Dispatch, State } from '../../modules/ReduxTypes.js'
import * as SETTINGS_SELECTORS from '../../modules/UI/Settings/selectors.js'
import { TwoButtonModalStyle } from '../../styles/indexStyles.js'

export const mapStateToProps = (state: State) => {
  const showModal = SETTINGS_SELECTORS.getOtpResetPending(state)
  return {
    style: TwoButtonModalStyle,
    headerText: s.strings.otp_modal_reset_headline,
    showModal,
    middleText: s.strings.otp_modal_reset_description,
    iconImage: iconImage,
    cancelText: s.strings.otp_disable,
    doneText: s.strings.otp_keep
  }
}

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  disableOtp: () => dispatch(disableOtp()),
  keepOtp: () => dispatch(keepOtp())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TwoButtonModalStyle)
