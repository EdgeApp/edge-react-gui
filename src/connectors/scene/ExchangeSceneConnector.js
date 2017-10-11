import {connect} from 'react-redux'
import LinkedComponent from '../../modules/UI/scenes/ExchangeSceneComponent'
import * as actions from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'

export const mapStateToProps = (state) => {
  const wallets = []
  for (const wallet in state.ui.wallets.byId) {
    wallets.push(state.ui.wallets.byId[wallet])
  }
  return {
    exchangeRate: state.cryptoExhange.exchangeRate,
    wallets: wallets,
    intialWalletOne: wallets.length > 0 ? wallets[0] : null,
    intialWalletTwo: wallets.length > 1 ? wallets[1] : null,
    fromWallet: state.cryptoExhange.fromWallet,
    toWallet: state.cryptoExhange.toWallet,
    fee: state.cryptoExhange.fee
  }
}

export const mapDispatchToProps = (dispatch) => ({
  selectFromWallet: (data: GuiWallet) => dispatch(actions.selectToFromWallet(Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE, data)),
  selectToWallet: (data: GuiWallet) => dispatch(actions.selectToFromWallet(Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE, data)),
  swapFromAndToWallets: () => dispatch(actions.dispatchAction(Constants.SWAP_FROM_TO_CRYPTO_WALLETS)),
  changeWalletOne:() => dispatch(actions.dispatchAction(Constants.SWAP_FROM_TO_CRYPTO_WALLETS)),
  changeWalletTwo:() => dispatch(actions.dispatchAction(Constants.SWAP_FROM_TO_CRYPTO_WALLETS)),
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkedComponent)
