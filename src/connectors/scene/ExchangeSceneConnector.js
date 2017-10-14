//@flow
import {GuiWallet} from '../../types'
import {connect} from 'react-redux'
import LinkedComponent from '../../modules/UI/scenes/ExchangeSceneComponent'
import * as actions from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'

export const mapStateToProps = (state: any) => {
  const wallets = []
  for (const wallet in state.ui.wallets.byId) {
    wallets.push(state.ui.wallets.byId[wallet])
  }
  return {
    exchangeRate: state.cryptoExchange.exchangeRate,
    wallets: wallets,
    intialWalletOne: wallets.length > 0 ? wallets[0] : null,
    intialWalletTwo: wallets.length > 1 ? wallets[1] : null,
    fromWallet: state.cryptoExchange.fromWallet,
    toWallet: state.cryptoExchange.toWallet,
    fromCurrencyCode: state.cryptoExchange.fromCurrencyCode,
    toCurrencyCode: state.cryptoExchange.toCurrencyCode,
    fee: state.cryptoExchange.fee,
    showModal: state.cryptoExchange.walletListModalVisible
  }
}

export const mapDispatchToProps = (dispatch: any) => ({
  selectFromWallet: (data: GuiWallet) => dispatch(actions.selectToFromWallet(Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE, data)),
  selectToWallet: (data: GuiWallet) => dispatch(actions.selectToFromWallet(Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE, data)),
  swapFromAndToWallets: () => dispatch(actions.dispatchAction(Constants.SWAP_FROM_TO_CRYPTO_WALLETS)),
  openModal:(data: string) => dispatch(actions.openWalletSelectorForExchange(Constants.OPEN_WALLET_SELECTOR_MODAL, data))
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkedComponent)
