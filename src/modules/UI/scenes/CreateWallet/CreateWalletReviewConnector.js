import {connect} from 'react-redux'
import CreateWalletReview from './CreateWalletReview.ui'
import {createCurrencyWallet} from './action'

const mapStateToProps = (state) => ({
  isCreatingWallet: state.ui.scenes.createWallet.isCreatingWallet
})

const mapDispatchToProps = (dispatch) => ({
  createCurrencyWallet: (walletName, walletType, fiatCurrencyCode) =>
    dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(CreateWalletReview)
