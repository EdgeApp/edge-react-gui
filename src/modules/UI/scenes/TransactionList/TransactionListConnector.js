// @flow

import {connect} from 'react-redux'
import _ from 'lodash'

import TransactionList from './TransactionList.ui'
import {
  // transactionsSearchVisible,
  // transactionsSearchHidden,
  getTransactionsRequest
} from './action'
import {setContactList} from '../../contacts/action'
import {updateExchangeRates} from '../../components/ExchangeRate/action'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {
  getSelectedWalletId,
  getSelectedWallet,
  getSelectedCurrencyCode,
  getTransactions
} from '../../selectors.js'
import {
  getSettings,
  getDisplayDenominationKey,
  getCustomTokens,
  getExchangeDenomination,
  getDisplayDenomination
} from '../../Settings/selectors.js'
import * as UTILS from '../../../utils'

import type {Dispatch, State} from '../../../ReduxTypes'

const mapStateToProps = (state: State) => {
  const selectedWalletId = getSelectedWalletId(state)
  const wallet = getSelectedWallet(state)
  if (!wallet) {
    return {
      loading: true
    }
  }

  const fiatSymbol = UTILS.getFiatSymbol(getSelectedWallet(state).fiatCurrencyCode)
  const currencyCode = getSelectedCurrencyCode(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const fiatCurrencyCode = wallet.fiatCurrencyCode
  const balanceInCrypto = wallet.nativeBalances[currencyCode]

  const settings = getSettings(state)
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)

  const transactions = getTransactions(state)

  const index = getDisplayDenominationKey(state, currencyCode)
  const denominationsOnWallet = wallet.allDenominations[currencyCode]
  let denomination
  if (denominationsOnWallet) {
    denomination = denominationsOnWallet[index]
  } else { // if it is a token
    const customTokens = getCustomTokens(state)
    const customTokenIndex = _.findIndex(customTokens, (item) => item.currencyCode === currencyCode)
    denomination = {
      ...customTokens[customTokenIndex].denominations[0],
      name: currencyCode,
      symbol: ''
    }
  }
  const multiplier = denomination.multiplier
  const exchangeDenomination = getExchangeDenomination(state, currencyCode)
  // $FlowFixMe
  const balanceInCryptoDisplay = UTILS.convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, balanceInCryptoDisplay)
  const displayDenomination = getDisplayDenomination(state, currencyCode)
  return {
    displayDenomination,
    updatingBalance: false,
    transactions,
    searchVisible: state.ui.scenes.transactionList.searchVisible,
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
    contacts: state.ui.contacts.contactList,
    fiatSymbol,
    showToWalletModal: state.ui.scenes.scan.scanToWalletListModalVisibility
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  getTransactions: (walletId, currencyCode) => dispatch(getTransactionsRequest(walletId, currencyCode)),
  updateExchangeRates: () => dispatch(updateExchangeRates()),
  setContactList: (contacts) => dispatch(setContactList(contacts))
  // transactionsSearchVisible: () => dispatch(transactionsSearchVisible()),
  // transactionsSearchHidden: () => dispatch(transactionsSearchHidden())
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionList)
