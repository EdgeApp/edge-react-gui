// @flow

import type { EdgeGetTransactionsOptions, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { RefreshControl, SectionList } from 'react-native'
import { connect } from 'react-redux'

import { fetchMoreTransactions } from '../../actions/TransactionListActions'
import s from '../../locales/strings'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import type { TransactionListTx } from '../../types/types.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { BuyCrypto } from '../themed/BuyCrypto.js'
import { EmptyLoader, SectionHeader, SectionHeaderCentered, Top } from '../themed/TransactionListComponents.js'
import { TransactionListRow } from '../themed/TransactionListRow.js'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5

type Section = {
  title: string,
  data: TransactionListTx[]
}

type StateProps = {
  getTransactions(opts?: EdgeGetTransactionsOptions): Promise<EdgeTransaction[]>,
  numTransactions: number,
  selectedWalletId: string,
  selectedCurrencyCode: string,
  transactions: TransactionListTx[]
}

type DispatchProps = {
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => void
}

type Props = StateProps & DispatchProps & ThemeProps

type State = {
  reset: boolean,
  searching: boolean,
  filteredTransactions: TransactionListTx[],
  loading: boolean
}

class TransactionListComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      reset: true,
      searching: false,
      filteredTransactions: [],
      loading: false
    }
  }

  componentDidMount = () => {
    this.props.fetchMoreTransactions(this.props.selectedWalletId, this.props.selectedCurrencyCode, this.state.reset)
    if (this.state.reset) {
      this.setState({ reset: false })
    }
  }

  componentDidUpdate(prevProps: Props) {
    const walletIdChanged = prevProps.selectedWalletId !== this.props.selectedWalletId
    const currencyCodeChanged = prevProps.selectedCurrencyCode !== this.props.selectedCurrencyCode

    if (walletIdChanged || currencyCodeChanged) {
      this.props.fetchMoreTransactions(this.props.selectedWalletId, this.props.selectedCurrencyCode, this.state.reset)
      if (this.state.reset) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ reset: false })
      }
    }
  }

  handleScrollEnd = () => {
    this.props.fetchMoreTransactions(this.props.selectedWalletId, this.props.selectedCurrencyCode, this.state.reset)
    if (this.state.reset) {
      this.setState({ reset: false })
    }
  }

  handleOnRefresh = () => {
    if (!this.state.searching) {
      this.setState({ filteredTransactions: this.props.transactions }, () => this.setState({ searching: true }))
    }
  }

  handleSearchTransaction = (searchString: string) => {
    const { getTransactions, selectedCurrencyCode, transactions } = this.props
    this.setState({ loading: true })
    getTransactions({
      currencyCode: selectedCurrencyCode,
      searchString
    })
      .then(filteredEdgeTransactions => {
        const filteredTransactions = transactions.filter(transaction => filteredEdgeTransactions.find(item => item.txid === transaction.txid))
        this.setState({ filteredTransactions, loading: false })
      })
      .catch(error => {
        this.setState({ loading: false })
        console.log(error)
      })
  }

  handleChangeSortingState = (isSearching: boolean) => (isSearching ? this.handleOnRefresh() : this.setState({ searching: false }))

  section = (transactions: TransactionListTx[]) => {
    const sections: Section[] = []
    for (const transaction of transactions) {
      const dateString = transaction.dateString || s.strings.fragment_transaction_list_no_date
      const checkTitle = sections.find(section => section.title === dateString)
      if (!checkTitle) {
        sections.push({
          title: dateString,
          data: [transaction]
        })
      } else {
        for (const section of sections) {
          if (section.title === dateString) {
            section.data.push(transaction)
            break
          }
        }
      }
    }
    return sections
  }

  emptySection = () => [{ title: s.strings.transaction_list_search_no_result, data: [] }]

  renderEmptyComponent = () =>
    this.props.numTransactions ? <EmptyLoader /> : <BuyCrypto walletId={this.props.selectedWalletId} currencyCode={this.props.selectedCurrencyCode} />

  renderSectionHeader = (section: { section: Section }) => {
    const { filteredTransactions, loading, searching } = this.state
    const checkFilteredTransactions = searching && filteredTransactions.length === 0
    if (checkFilteredTransactions || loading) {
      return <SectionHeaderCentered title={section.section.title} loading={loading} />
    }
    return <SectionHeader title={section.section.title} />
  }

  renderTransaction = (transaction: SectionList<TransactionListTx>) => {
    const { selectedWalletId, selectedCurrencyCode } = this.props
    return <TransactionListRow walletId={selectedWalletId} currencyCode={selectedCurrencyCode} transaction={transaction.item} />
  }

  renderTop = () => (
    <Top
      walletId={this.props.selectedWalletId}
      isEmpty={this.props.transactions.length < 1}
      searching={this.state.searching}
      onChangeSortingState={this.handleChangeSortingState}
      onSearchTransaction={this.handleSearchTransaction}
    />
  )

  keyExtractor = (item: TransactionListTx) => String(item.key)
  render() {
    const { filteredTransactions, loading, reset, searching } = this.state
    const transactions = reset ? [] : searching ? filteredTransactions : this.props.transactions
    const checkFilteredTransactions = searching && filteredTransactions.length === 0
    return (
      <SceneWrapper>
        <SectionList
          sections={checkFilteredTransactions || loading ? this.emptySection() : this.section(transactions)}
          renderItem={this.renderTransaction}
          renderSectionHeader={this.renderSectionHeader}
          initialNumToRender={INITIAL_TRANSACTION_BATCH_NUMBER}
          onEndReached={this.handleScrollEnd}
          onEndReachedThreshold={SCROLL_THRESHOLD}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={this.renderEmptyComponent}
          ListHeaderComponent={this.renderTop}
          contentOffset={{ y: !searching && transactions.length > 0 ? this.props.theme.rem(4.5) : 0 }}
          refreshControl={
            transactions.length !== 0 ? (
              <RefreshControl refreshing={false} onRefresh={this.handleOnRefresh} tintColor={this.props.theme.searchListRefreshControlIndicator} />
            ) : undefined
          }
          keyboardShouldPersistTaps="handled"
        />
      </SceneWrapper>
    )
  }
}

export const TransactionList = connect(
  (state: RootState) => {
    const selectedWalletId = state.ui.wallets.selectedWalletId
    const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode

    // getTransactions
    const { currencyWallets } = state.core.account
    const currencyWallet = currencyWallets[selectedWalletId]
    const { getTransactions } = currencyWallet

    return {
      getTransactions,
      numTransactions: state.ui.scenes.transactionList.numTransactions,
      selectedCurrencyCode,
      selectedWalletId,
      transactions: state.ui.scenes.transactionList.transactions
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    fetchMoreTransactions(walletId: string, currencyCode: string, reset: boolean) {
      dispatch(fetchMoreTransactions(walletId, currencyCode, reset))
    }
  })
)(withTheme(TransactionListComponent))
