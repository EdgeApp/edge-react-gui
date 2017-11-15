import {connect} from 'react-redux'
import TransactionList from './TransactionList.ui'
import {
  // transactionsSearchVisible,
  // transactionsSearchHidden,
  getTransactionsRequest
} from './action'
import {setContactsList} from '../../contacts/action'
import {updateExchangeRates} from '../../components/ExchangeRate/action'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as UTILS from '../../../utils'

const mapStateToProps = (state) => {
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  if (!wallet) return {
    loading: true
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
  const denomination = wallet.allDenominations[currencyCode][index]
  const multiplier = denomination.multiplier
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, currencyCode)
  const balanceInCryptoDisplay = UTILS.convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = currencyConverter.convertCurrency(currencyCode, isoFiatCurrencyCode, balanceInCryptoDisplay)
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
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

const mapDispatchToProps = (dispatch) => ({
  getTransactions: (walletId, currencyCode) => dispatch(getTransactionsRequest(walletId, currencyCode)),
  updateExchangeRates: () => dispatch(updateExchangeRates()),
  setContactsList: (contacts) => dispatch(setContactsList(contacts)),
  // transactionsSearchVisible: () => dispatch(transactionsSearchVisible()),
  // transactionsSearchHidden: () => dispatch(transactionsSearchHidden())
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionList)
