import {connect} from 'react-redux'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import {createWallet} from './action'

import CreateWallet from './CreateWallet.ui'

const mapStateToProps = (state) => ({
  supportedWalletTypes: SETTINGS_SELECTORS.getSupportedWalletTypes(state)
})

const mapDispatchToProps = (dispatch) => ({
  createWallet: (walletName, walletType) => dispatch(createWallet(walletName, walletType))
})

export default connect(mapStateToProps, mapDispatchToProps)(CreateWallet)
