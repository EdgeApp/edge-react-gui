import {connect} from 'react-redux'
import DefaultFiatSetting from './DefaultFiatSetting.ui'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import {setDefaultFiatRequest} from './action'
import {Actions} from 'react-native-router-flux'
import * as UTILS from '../../../utils'

const mapStateToProps = (state) => ({
  defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
  supportedFiats: UTILS.getSupportedFiats()
})
const mapDispatchToProps = (dispatch) => ({
  onSelectFiat: (selectedDefaultFiat) => {
    dispatch(setDefaultFiatRequest(selectedDefaultFiat))
    Actions.settingsOverview()
  }
})
export default connect(mapStateToProps, mapDispatchToProps)(DefaultFiatSetting)
