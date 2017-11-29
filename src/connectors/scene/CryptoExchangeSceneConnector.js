//@flow

import {GuiWallet} from '../../types'
import {connect} from 'react-redux'
import LinkedComponent from '../../modules/UI/scenes/CryptoExchange/CryptoExchangeSceneComponent'
import * as actions from '../../actions/indexActions'
import * as Constants from '../../constants/indexConstants'

export const mapStateToProps = (state: any) => {
  const wallets = []
  for (const wallet in state.ui.wallets.byId) {
    wallets.push(state.ui.wallets.byId[wallet])
  }
  const exchangeRate =  state.cryptoExchange.exchangeRate
  const fromAmountNative =  '.01'
  const toAmountNative = Number(fromAmountNative)*exchangeRate //TODO: math with exchange rate. ( from )
  return {
    exchangeRate,
    wallets: wallets,
    intialWalletOne: wallets.length > 0 ? wallets[0] : null,
    intialWalletTwo: wallets.length > 1 ? wallets[1] : null,
    fromWallet: state.cryptoExchange.fromWallet,
    toWallet: state.cryptoExchange.toWallet,
    fromCurrencyCode: state.cryptoExchange.fromCurrencyCode,
    toCurrencyCode: state.cryptoExchange.toCurrencyCode,
    fromDisplayAmount: state.cryptoExchange.fromDisplayAmount,
    toDisplayAmount: state.cryptoExchange.toDisplayAmount,
    fromAmountNative,
    toAmountNative,
    fromCurrencyIcon: state.cryptoExchange.fromCurrencyIcon,
    fromCurrencyIconDark: state.cryptoExchange.fromCurrencyIconDark,
    toCurrencyIcon: state.cryptoExchange.toCurrencyIcon,
    toCurrencyIconDark: state.cryptoExchange.toCurrencyIconDark,
    fee: state.cryptoExchange.fee,
    showWalletSelectModal: state.cryptoExchange.walletListModalVisible,
    showConfirmShiftModal: state.cryptoExchange.confirmTransactionModalVisible,
    showNextButton: state.cryptoExchange.transaction
  }
}

export const mapDispatchToProps = (dispatch: any) => ({
  selectFromWallet: (data: GuiWallet) => dispatch(actions.selectToFromWallet(Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE, data)),
  selectToWallet: (data: GuiWallet) => dispatch(actions.selectToFromWallet(Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE, data)),
  swapFromAndToWallets: () => dispatch(actions.dispatchAction(Constants.SWAP_FROM_TO_CRYPTO_WALLETS)),
  openModal:(data: string) => dispatch(actions.dispatchActionString(Constants.OPEN_WALLET_SELECTOR_MODAL, data)),
  shift: () => dispatch(actions.shiftCryptoCurrency()),
  closeConfirmation: () => dispatch(actions.dispatchAction(Constants.CLOSE_CRYPTO_EXC_CONF_MODAL)),
  openConfirmation: () => dispatch(actions.dispatchAction(Constants.OPEN_CRYPTO_EXC_CONF_MODAL))

})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkedComponent)
