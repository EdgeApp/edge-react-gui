import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import * as UTILS from '../../../utils'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import { setDefaultFiatRequest } from './action'
import DefaultFiatSetting from './DefaultFiatSetting.ui'

const mapStateToProps = state => ({
  defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
  supportedFiats: UTILS.getSupportedFiats(),
  dimensions: state.ui.scenes.dimensions
})
const mapDispatchToProps = dispatch => ({
  onSelectFiat: selectedDefaultFiat => {
    dispatch(setDefaultFiatRequest(selectedDefaultFiat))
    Actions.pop()
  }
})
export default connect(mapStateToProps, mapDispatchToProps)(DefaultFiatSetting)
