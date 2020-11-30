// @flow

import type { EdgeCurrencyInfo, EdgeCurrencyWallet } from 'edge-core-js'
import { connect } from 'react-redux'

import { fetchMoreTransactions } from '../../actions/TransactionListActions'
import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions.js'
import type { DispatchProps, StateProps } from '../../components/scenes/TransactionListScene'
import { TransactionList } from '../../components/scenes/TransactionListScene'
import { getDisplayDenomination } from '../../modules/Settings/selectors.js'
import { getSelectedCurrencyCode, getSelectedWallet, getSelectedWalletId, getTransactions } from '../../modules/UI/selectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { getFiatSymbol } from '../../util/utils'

const mapStateToProps = (state: RootState) => {
  const selectedWalletId = getSelectedWalletId(state)
  const wallet = getSelectedWallet(state)
  if (!wallet) {
    return {
      loading: true
    }
  }
  const { currencyWallets = {} } = state.core.account
  const coreWallet: EdgeCurrencyWallet = currencyWallets[selectedWalletId]
  const fiatSymbol = getFiatSymbol(getSelectedWallet(state).fiatCurrencyCode)
  const currencyCode = getSelectedCurrencyCode(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const fiatCurrencyCode = wallet.fiatCurrencyCode
  const numTransactions = state.ui.scenes.transactionList.numTransactions
  const transactions = getTransactions(state)
  const displayDenomination = getDisplayDenomination(state, currencyCode)
  const currencyInfo: EdgeCurrencyInfo = coreWallet.currencyInfo
  // set default requiredConfirmations to 1, so once the tx is in a block consider fully confirmed
  const requiredConfirmations = currencyInfo.requiredConfirmations ? currencyInfo.requiredConfirmations : 1

  const out: StateProps = {
    loading: false,
    displayDenomination,
    transactions,
    // searchVisible: state.ui.scenes.transactionList.searchVisible,
    selectedWalletId,
    selectedCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    fiatCurrencyCode,
    uiWallet: wallet,
    contacts: state.contacts,
    fiatSymbol,
    requiredConfirmations,
    numTransactions
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => dispatch(fetchMoreTransactions(walletId, currencyCode, reset)),
  toggleBalanceVisibility: () => {
    dispatch(toggleAccountBalanceVisibility())
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionList)
