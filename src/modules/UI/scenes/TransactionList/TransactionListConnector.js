// @flow

import type { EdgeCurrencyInfo, EdgeCurrencyWallet } from 'edge-core-js'
import _ from 'lodash'
import { connect } from 'react-redux'

import { getWallet } from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import { convertNativeToExchange, getFiatSymbol } from '../../../utils'
import { convertCurrency, getSelectedCurrencyCode, getSelectedWallet, getSelectedWalletId, getTransactions } from '../../selectors.js'
import { getCustomTokens, getDisplayDenomination, getDisplayDenominationKey, getExchangeDenomination, getSettings } from '../../Settings/selectors.js'
import { selectWalletFromModal } from '../../Wallets/action.js'
import { toggleAccountBalanceVisibility } from '../WalletList/action.js'
import { fetchMoreTransactions } from './action'
import type { DispatchProps, StateProps } from './TransactionList.ui'
import { TransactionList } from './TransactionList.ui'

const mapStateToProps = (state: State) => {
  const selectedWalletId = getSelectedWalletId(state)
  const wallet = getSelectedWallet(state)
  if (!wallet) {
    return {
      loading: true
    }
  }
  const coreWallet: EdgeCurrencyWallet = getWallet(state, selectedWalletId)
  const fiatSymbol = getFiatSymbol(getSelectedWallet(state).fiatCurrencyCode)
  const currencyCode = getSelectedCurrencyCode(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const fiatCurrencyCode = wallet.fiatCurrencyCode
  const balanceInCrypto = wallet.nativeBalances[currencyCode]
  const numTransactions = state.ui.scenes.transactionList.numTransactions
  const settings = getSettings(state)
  const transactions = getTransactions(state)
  const index = getDisplayDenominationKey(state, currencyCode)
  const denominationsOnWallet = wallet.allDenominations[currencyCode]
  let denomination
  if (denominationsOnWallet) {
    denomination = denominationsOnWallet[index]
  } else {
    // if it is a token
    const customTokens = getCustomTokens(state)
    const customTokenIndex = _.findIndex(customTokens, item => item.currencyCode === currencyCode)
    denomination = {
      ...customTokens[customTokenIndex].denominations[0],
      name: currencyCode,
      symbol: ''
    }
  }
  const multiplier = denomination.multiplier
  const exchangeDenomination = getExchangeDenomination(state, currencyCode)
  // $FlowFixMe
  const balanceInCryptoDisplay = convertNativeToExchange(exchangeDenomination.multiplier)(balanceInCrypto)
  const balanceInFiat = convertCurrency(state, currencyCode, isoFiatCurrencyCode, parseFloat(balanceInCryptoDisplay))
  const displayDenomination = getDisplayDenomination(state, currencyCode)
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
    selectedWalletId,
    selectedCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    fiatCurrencyCode,
    uiWallet: wallet,
    settings,
    balanceInCrypto,
    balanceInFiat,
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
  onSelectWallet: (walletId: string, currencyCode: string) => {
    dispatch(selectWalletFromModal(walletId, currencyCode))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransactionList)
