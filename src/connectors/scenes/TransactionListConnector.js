// @flow

import { connect } from 'react-redux'

import { fetchMoreTransactions } from '../../actions/TransactionListActions'
import type { DispatchProps, StateProps } from '../../components/scenes/TransactionListScene'
import { TransactionList } from '../../components/scenes/TransactionListScene'
import { getSelectedCurrencyCode, getSelectedWalletId, getTransactions } from '../../modules/UI/selectors.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'

const mapStateToProps = (state: RootState) => {
  const selectedWalletId = getSelectedWalletId(state)
  const currencyCode = getSelectedCurrencyCode(state)
  const transactions = getTransactions(state)

  const out: StateProps = {
    transactions,
    selectedWalletId,
    numTransactions: state.ui.scenes.transactionList.numTransactions,
    selectedCurrencyCode: currencyCode
  }
  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => dispatch(fetchMoreTransactions(walletId, currencyCode, reset))
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionList)
