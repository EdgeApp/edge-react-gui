import {connect} from 'react-redux'
import CreateWallet from './CreateWallet.ui'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as UTILS from '../../../utils'
import {createCurrencyWallet} from './action'

const mapStateToProps = (state) => ({
  supportedWalletTypes: SETTINGS_SELECTORS.getSupportedWalletTypes(state),
  supportedFiats: UTILS.getSupportedFiats()
})

const mapDispatchToProps = (dispatch) => ({
  createCurrencyWallet: (walletName, walletType, fiatCurrencyCode) =>
    dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(CreateWallet)
