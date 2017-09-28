import {connect} from 'react-redux'
import CreateWallet from './CreateWallet.ui'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as UTILS from '../../../utils'
import {createWallet} from './action'

const mapStateToProps = (state) => ({
  supportedWalletTypes: SETTINGS_SELECTORS.getSupportedWalletTypes(state),
  supportedFiats: UTILS.getSupportedFiats()
})

const mapDispatchToProps = (dispatch) => ({
  createWallet: (walletName, walletType) => dispatch(createWallet(walletName, walletType))
})

export default connect(mapStateToProps, mapDispatchToProps)(CreateWallet)
