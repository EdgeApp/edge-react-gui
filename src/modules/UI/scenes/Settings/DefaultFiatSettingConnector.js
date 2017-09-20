import {connect} from 'react-redux'
import DefaultFiatSetting from './DefaultFiatSetting.ui'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import {setDefaultFiatRequest} from './action'
import * as UTILS from '../../../utils'

const mapStateToProps = (state) => ({
  defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
  supportedFiats: UTILS.getSupportedFiats()
})
const mapDispatchToProps = (dispatch) => ({
  setDefaultFiat: (selectedDefaultFiat) => dispatch(setDefaultFiatRequest(selectedDefaultFiat))
})
export default connect(mapStateToProps, mapDispatchToProps)(DefaultFiatSetting)
