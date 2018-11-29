// @flow

import { type EdgeParsedUri } from 'edge-core-js'
import { connect } from 'react-redux'

import { createAccountTransaction, fetchAccountActivationInfo, fetchAccountActivationPaymentInfo } from '../../actions/CreateWalletActions.js'
import { CreateWalletAccountSelect, type AccountPaymentParams } from '../../components/scenes/CreateWalletAccountSelectScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { type GuiMakeSpendInfo } from '../../reducers/scenes/SendConfirmationReducer.js'

const mapStateToProps = (state: State) => {
  const handleActivationInfo = state.ui.scenes.createWallet.handleActivationInfo
  const accountActivationPaymentInfo = state.ui.scenes.createWallet.accountActivationPaymentInfo
  const { supportedCurrencies, activationCost } = handleActivationInfo
  const { currencyCode, paymentAddress, exchangeAmount, nativeAmount, expirationDate } = accountActivationPaymentInfo

  return {
    paymentCurrencyCode: currencyCode,
    paymentAddress,
    exchangeAmount,
    nativeAmount,
    expirationDate,
    supportedCurrencies,
    activationCost,
    wallets: state.ui.wallets.byId
  }
}

const mapDispatchToProps = (dispatch: Dispatch): CreateWalletAccountSelectDispatchProps => ({
  createAccountTransaction: (walletId: string, data: GuiMakeSpendInfo | EdgeParsedUri) => dispatch(createAccountTransaction(walletId, data)),
  fetchAccountActivationInfo: (currencyCode: string) => dispatch(fetchAccountActivationInfo(currencyCode)),
  fetchAccountActivationPaymentInfo: (paymentInfo: AccountPaymentParams) => dispatch(fetchAccountActivationPaymentInfo(paymentInfo))
})

export const CreateWalletAccountSelectConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletAccountSelect)
