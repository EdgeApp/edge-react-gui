// @flow

import _ from 'lodash'
import { connect } from 'react-redux'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import * as UTILS from '../../../utils'
import { updateExchangeRates } from '../../components/ExchangeRate/action'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import { fetchMoreTransactions } from './action'
import { type DispatchProps, type StateProps, TransactionList } from './TransactionList.ui'

const mapStateToProps = (state: State) => {
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  if (!wallet) {
    return {
      loading: true
    }
  }

  const fiatSymbol = UTILS.getFiatSymbol(UI_SELECTORS.getSelectedWallet(state).fiatCurrencyCode)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const fiatCurrencyCode = wallet.fiatCurrencyCode
  const balanceInCrypto = wallet.nativeBalances[currencyCode]

  const settings = SETTINGS_SELECTORS.getSettings(state)
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)

  const transactions = UI_SELECTORS.getTransactions(state)

  const index = SETTINGS_SELECTORS.getDisplayDenominationKey(state, currencyCode)
  const denominationsOnWallet = wallet.allDenominations[currencyCode]
  let denomination
  if (denominationsOnWallet) {
    denomination = denominationsOnWallet[index]
  } else {
    // if it is a token
    const customTokens = SETTINGS_SELECTORS.getCustomTokens(state)
    const customTokenIndex = _.findIndex(customTokens, item => item.currencyCode === currencyCode)
    denomination = {
      ...customTokens[customTokenIndex].denominations[0],
      name: currencyCode,
      symbol: ''
    }
  }
  const multiplier = denomination.multiplier
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, currencyCode)
  // $FlowFixMe
  const balanceInCryptoDisplay = UTILS.convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, balanceInCryptoDisplay)
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)

  const out: StateProps = {
    loading: false,
    displayDenomination,
    updatingBalance: false,
    transactions,
    // searchVisible: state.ui.scenes.transactionList.searchVisible,
    contactsList: state.ui.scenes.transactionList.contactsList,
    selectedWalletId,
    selectedCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    fiatCurrencyCode,
    uiWallet: wallet,
    settings,
    balanceInCrypto,
    balanceInFiat,
    currencyConverter,
    multiplier,
    contacts: state.contacts,
    fiatSymbol,
    showToWalletModal: state.ui.scenes.scan.scanToWalletListModalVisibility
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  updateExchangeRates: () => dispatch(updateExchangeRates()),
  fetchMoreTransactions: (walletId: string, currencyCode: string) => dispatch(fetchMoreTransactions(walletId, currencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionList)
