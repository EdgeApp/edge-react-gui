// @flow

import type { EdgeCurrencyInfo, EdgeCurrencyWallet } from 'edge-core-js'
import _ from 'lodash'
import { connect } from 'react-redux'

import * as CORE_SELECTORS from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import * as UTILS from '../../../utils'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import { selectWalletFromModal } from '../../Wallets/action.js'
import { toggleAccountBalanceVisibility } from '../WalletList/action.js'
import { fetchMoreTransactions } from './action'
import type { DispatchProps, StateProps } from './TransactionList.ui'
import { TransactionList } from './TransactionList.ui'

const mapStateToProps = (state: State) => {
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = UI_SELECTORS.getSelectedWallet(state)
  if (!wallet) {
    return {
      loading: true
    }
  }
  const coreWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, selectedWalletId)
  const fiatSymbol = UTILS.getFiatSymbol(UI_SELECTORS.getSelectedWallet(state).fiatCurrencyCode)
  const currencyCode = UI_SELECTORS.getSelectedCurrencyCode(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const fiatCurrencyCode = wallet.fiatCurrencyCode
  const balanceInCrypto = wallet.nativeBalances[currencyCode]
  const numTransactions = state.ui.scenes.transactionList.numTransactions
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
  const currencyInfo: EdgeCurrencyInfo = coreWallet.currencyInfo
  // set default requiredConfirmations to 1, so once the tx is in a block consider fully confirmed
  const requiredConfirmations = currencyInfo.requiredConfirmations ? currencyInfo.requiredConfirmations : 1
  const isBalanceVisible = state.ui.settings.isAccountBalanceVisible

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
    showToWalletModal: state.ui.scenes.walletListModal.walletListModalVisible,
    requiredConfirmations,
    numTransactions,
    isBalanceVisible
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => dispatch(fetchMoreTransactions(walletId, currencyCode, reset)),
  toggleBalanceVisibility: () => {
    dispatch(toggleAccountBalanceVisibility())
  },
  onSelectWallet: (walletId: string, currencyCode: string) => dispatch(selectWalletFromModal(walletId, currencyCode))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransactionList)
