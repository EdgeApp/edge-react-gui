import {connect} from 'react-redux'
import CreateWalletSelectFiat from './CreateWalletSelectFiat.ui'
import * as UTILS from '../../../utils'

const mapStateToProps = (state) => ({
  supportedFiats: UTILS.getSupportedFiats(),
  dimensions: state.ui.scenes.dimensions
})

export default connect(mapStateToProps)(CreateWalletSelectFiat)
