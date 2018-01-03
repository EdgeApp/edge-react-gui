// @flow
import {connect} from 'react-redux'
//import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {Actions} from 'react-native-router-flux'
import OtpSettingsSceneComponent from '../../modules/UI/scenes/Otp/OtpSettingsSceneComponent.js'
import * as Constants from '../../constants/indexConstants.js'

export const mapStateToProps = () => ({
 /*  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state) */
})

export const mapDispatchToProps = () => ({
  onComplete: () => Actions[Constants.SETTINGS_OVERVIEW]()
})

export default connect(mapStateToProps, mapDispatchToProps)(OtpSettingsSceneComponent)
