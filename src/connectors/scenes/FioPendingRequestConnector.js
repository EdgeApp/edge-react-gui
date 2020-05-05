// @flow

import { connect } from 'react-redux'

import type {
  FioPendingRequestDetailsDispatchProps as DispatchProps,
  FioPendingRequestDetailsStateProps as StateProps,
  NavigationProps
} from '../../components/scenes/FioPendingRequestDetailsScene'
import { FioPendingRequestDetailsComponent } from '../../components/scenes/FioPendingRequestDetailsScene'
import { FIAT_CODES_SYMBOLS } from '../../constants/indexConstants'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes'
import { emptyGuiDenomination } from '../../types/types'

const mapStateToProps = (state: State, ownProps: NavigationProps) => {
  const { selectedFioPendingRequest } = ownProps
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const fioWallets = UI_SELECTORS.getFioWallets(state)
  const fioWalletByAddress = fioWallets.find(wallet => wallet.id === selectedFioPendingRequest.fioWalletId) || null
  if (!wallet && !fioWalletByAddress) {
    const out: StateProps = {
      exchangeDenomination: emptyGuiDenomination,
      fromCurrencyCode: '',
      wallets: {},
      isoFiatCurrencyCode: '',
      fiatSymbol: '',
      exchangeRates: {},
      selectedWallet: wallet,
      fioWalletByAddress
    }
    return out
  }
  const fioWalletIsoFiatCurrencyCode = fioWalletByAddress ? fioWalletByAddress.fiatCurrencyCode : SETTINGS_SELECTORS.getDefaultIsoFiat(state)
  const fiatCurrencyCode = wallet ? wallet.fiatCurrencyCode : fioWalletIsoFiatCurrencyCode.replace('iso:', '')
  const isoFiatCurrencyCode = wallet ? wallet.isoFiatCurrencyCode : fioWalletIsoFiatCurrencyCode
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, selectedFioPendingRequest.content.token_code)
  const fiatSymbol = FIAT_CODES_SYMBOLS[fiatCurrencyCode]
  const fromCurrencyCode = selectedFioPendingRequest.content.token_code
  const exchangeRates = state.exchangeRates
  const wallets = state.ui.wallets.byId
  const out: StateProps = {
    exchangeDenomination,
    fromCurrencyCode,
    wallets,
    isoFiatCurrencyCode,
    fiatSymbol,
    exchangeRates,
    selectedWallet: wallet,
    fioWalletByAddress
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  openModal: (data: 'from' | 'to') => dispatch({ type: 'OPEN_WALLET_SELECTOR_MODAL', data }),
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch({ type: 'UI/WALLETS/SELECT_WALLET', data: { currencyCode: currencyCode, walletId: walletId } })
  }
})

export const FioPendingRequestConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(FioPendingRequestDetailsComponent)
