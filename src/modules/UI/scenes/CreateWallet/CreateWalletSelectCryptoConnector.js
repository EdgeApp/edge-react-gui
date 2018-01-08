import {connect} from 'react-redux'
import CreateWalletSelectCrypto from './CreateWalletSelectCrypto.ui'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'

const mapStateToProps = (state) => ({
  supportedWalletTypes: SETTINGS_SELECTORS.getSupportedWalletTypes(state),
  dimensions: state.ui.scenes.dimensions
})

export default connect(mapStateToProps)(CreateWalletSelectCrypto)
