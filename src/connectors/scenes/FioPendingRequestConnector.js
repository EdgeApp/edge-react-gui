// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import type {
  FioPendingRequestDetailsDispatchProps as DispatchProps,
  FioPendingRequestDetailsStateProps as StateProps,
  NavigationProps
} from '../../components/scenes/FioPendingRequestDetailsScene'
import { FioPendingRequestDetailsComponent } from '../../components/scenes/FioPendingRequestDetailsScene'
import { FIAT_CODES_SYMBOLS } from '../../constants/indexConstants'
import { setFioWalletByFioAddress } from '../../modules/FioAddress/action'
import { confirmRequest } from '../../modules/FioRequest/action'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes'
import { emptyGuiDenomination } from '../../types/types'

const mapStateToProps = (state: State, ownProps: NavigationProps) => {
  const { selectedFioPendingRequest } = ownProps
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const fioWalletByAddress = UI_SELECTORS.getFioWalletByAddress(state)
  if (!wallet && !fioWalletByAddress) {
    const out: StateProps = {
      exchangeDenomination: emptyGuiDenomination,
      supportedWalletTypes: [],
      fromCurrencyCode: '',
      wallets: {},
      isoFiatCurrencyCode: '',
      fiatSymbol: '',
      exchangeRates: {},
      toCurrencyCode: '',
      selectedWallet: wallet,
      fioWalletByAddress
    }
    return out
  }
  const fioWalletIsoFiatCurrencyCode = fioWalletByAddress ? fioWalletByAddress.fiatCurrencyCode : SETTINGS_SELECTORS.getDefaultIsoFiat(state)
  const fiatCurrencyCode = wallet ? wallet.fiatCurrencyCode : fioWalletIsoFiatCurrencyCode.replace('iso:', '')
  const isoFiatCurrencyCode = wallet ? wallet.isoFiatCurrencyCode : fioWalletIsoFiatCurrencyCode
  const supportedWalletTypes = SETTINGS_SELECTORS.getSupportedWalletTypes(state)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, selectedFioPendingRequest.content.token_code)
  const fiatSymbol = FIAT_CODES_SYMBOLS[fiatCurrencyCode]
  const fromCurrencyCode = selectedFioPendingRequest.content.token_code
  const toCurrencyCode = selectedFioPendingRequest.content.token_code
  const exchangeRates = state.exchangeRates
  const wallets = state.ui.wallets.byId
  const out: StateProps = {
    exchangeDenomination,
    supportedWalletTypes,
    fromCurrencyCode,
    wallets,
    isoFiatCurrencyCode,
    fiatSymbol,
    exchangeRates,
    toCurrencyCode,
    selectedWallet: wallet,
    fioWalletByAddress
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  openModal: (data: 'from' | 'to') => dispatch({ type: 'OPEN_WALLET_SELECTOR_MODAL', data }),
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch({ type: 'UI/WALLETS/SELECT_WALLET', data: { currencyCode: currencyCode, walletId: walletId } })
  },
  fioAcceptRequest: (
    fioWalletByAddress: EdgeCurrencyWallet,
    pendingRequest: Object,
    payerPublicAddress: string,
    txId: string,
    notes?: string,
    fee: number,
    cb: Function
  ) => {
    dispatch(confirmRequest(fioWalletByAddress, pendingRequest, payerPublicAddress, txId, notes, fee, cb))
  },
  setFioWalletByFioAddress: (payerPublicAddress: string) => {
    dispatch(setFioWalletByFioAddress(payerPublicAddress))
  }
})

export const FioPendingRequestConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioPendingRequestDetailsComponent)
