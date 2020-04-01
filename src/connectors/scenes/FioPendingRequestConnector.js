// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import Locale from 'react-native-locale'
import { connect } from 'react-redux'

import { createCurrencyWalletAndAddToSwap } from '../../actions/CreateWalletActions'
import { selectWalletForExchange } from '../../actions/CryptoExchangeActions.js'
import type {
  FioPendingRequestDetailsDispatchProps as DispatchProps,
  FioPendingRequestDetailsStateProps as StateProps
} from '../../components/scenes/FioPendingRequestDetailsScene'
import { FioPendingRequestDetailsComponent } from '../../components/scenes/FioPendingRequestDetailsScene'
import { DEFAULT_STARTER_WALLET_NAMES, USD_FIAT } from '../../constants/indexConstants'
import { setFioWalletByFioAddress } from '../../modules/FioAddress/action'
import { confirmRequest } from '../../modules/FioRequest/action'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes'
import type { GuiWallet } from '../../types/types'
import { emptyGuiWallet } from '../../types/types'

const mapStateToProps = (state: State) => {
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const selectedFioPendingRequest = UI_SELECTORS.getFioSelectedRequest(state)
  const fioWalletByAddress = UI_SELECTORS.getFioWalletByAddress(state)
  const supportedWalletTypes = SETTINGS_SELECTORS.getSupportedWalletTypes(state)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, selectedFioPendingRequest.content.token_code)
  const fromWallet: GuiWallet | null = state.cryptoExchange.fromWallet
  const toWallet: GuiWallet | null = state.cryptoExchange.toWallet
  const wallets = state.ui.wallets.byId
  const fiatSymbol = ''
  let fromCurrencyCode
  if (fromWallet) {
    fromCurrencyCode = state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name
  } else {
    fromCurrencyCode = ''
  }

  const exchangeRates = state.exchangeRates
  const toCurrencyCode = state.cryptoExchange.toCurrencyCode || ''

  const out: StateProps = {
    selectedFioPendingRequest,
    exchangeDenomination,
    supportedWalletTypes,
    fromCurrencyCode,
    wallets,
    state,
    isoFiatCurrencyCode,
    fiatSymbol,
    exchangeRates,
    fromWallet: fromWallet || emptyGuiWallet,
    toCurrencyCode,
    toWallet: toWallet || emptyGuiWallet,
    fioWalletByAddress
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  createCurrencyWallet: (walletType: string, currencyCode: string) => {
    const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux
    let fiatCurrencyCode = USD_FIAT
    if (localeInfo.currencyCode && typeof localeInfo.currencyCode === 'string' && localeInfo.currencyCode.length >= 3) {
      fiatCurrencyCode = 'iso:' + localeInfo.currencyCode
    }
    const walletName = DEFAULT_STARTER_WALLET_NAMES[currencyCode]
    dispatch(createCurrencyWalletAndAddToSwap(walletName, walletType, fiatCurrencyCode))
  },
  openModal: (data: 'from' | 'to') => dispatch({ type: 'OPEN_WALLET_SELECTOR_MODAL', data }),
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch(selectWalletForExchange(walletId, currencyCode))
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
