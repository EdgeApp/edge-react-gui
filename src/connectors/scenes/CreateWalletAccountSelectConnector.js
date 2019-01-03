// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import {
  createAccountTransaction,
  createCurrencyWallet,
  fetchAccountActivationInfo,
  fetchWalletAccountActivationPaymentInfo
} from '../../actions/CreateWalletActions.js'
import { type AccountPaymentParams, CreateWalletAccountSelect } from '../../components/scenes/CreateWalletAccountSelectScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { getDefaultDenomination } from '../../modules/UI/selectors.js'

const mapStateToProps = (state: State) => {
  const handleActivationInfo = state.ui.scenes.createWallet.handleActivationInfo
  const walletAccountActivationPaymentInfo = state.ui.scenes.createWallet.walletAccountActivationPaymentInfo
  const { supportedCurrencies, activationCost } = handleActivationInfo
  const { currencyCode, paymentAddress, amount, expireTime } = walletAccountActivationPaymentInfo
  const isCreatingWallet = state.ui.scenes.createWallet.isCreatingWallet
  const paymentDenomination = currencyCode ? getDefaultDenomination(state, currencyCode) : {}
  let paymentDenominationSymbol
  if (paymentDenomination) {
    paymentDenominationSymbol = paymentDenomination.symbol ? paymentDenomination.symbol : ''
  } else {
    paymentDenominationSymbol = ''
  }

  return {
    paymentCurrencyCode: currencyCode,
    paymentAddress,
    amount,
    expireTime,
    supportedCurrencies,
    activationCost,
    wallets: state.ui.wallets.byId,
    isCreatingWallet,
    paymentDenominationSymbol
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  createAccountTransaction: (createdWalletId: string, accountName: string, paymentWalletId: string) =>
    dispatch(createAccountTransaction(createdWalletId, accountName, paymentWalletId)),
  fetchAccountActivationInfo: (currencyCode: string) => dispatch(fetchAccountActivationInfo(currencyCode)),
  fetchWalletAccountActivationPaymentInfo: (paymentInfo: AccountPaymentParams, createdCoreWallet: EdgeCurrencyWallet) =>
    dispatch(fetchWalletAccountActivationPaymentInfo(paymentInfo, createdCoreWallet)),
  createAccountBasedWallet: (walletName: string, walletType: string, fiatCurrencyCode: string, popScene: boolean, selectWallet: boolean) =>
    dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode, popScene, selectWallet))
})

export const CreateWalletAccountSelectConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletAccountSelect)
