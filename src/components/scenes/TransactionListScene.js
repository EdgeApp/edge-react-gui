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
import { EmptyLoader, SectionHeader, Top } from '../themed/TransactionListComponents.js'
import { TransactionListRow } from '../themed/TransactionListRow.js'
import { ThemedTicker } from '../themed/ThemedTicker.js'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5

type Section = {
  title: string,
  data: TransactionListTx[]
}

export type StateProps = {
  getTransactions(opts?: EdgeGetTransactionsOptions): Promise<EdgeTransaction[]>,
  numTransactions: number,
  selectedWalletId: string,
  selectedCurrencyCode: string,
  transactions: TransactionListTx[]
}

export type DispatchProps = {
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => any
}

type Props = StateProps & DispatchProps & ThemeProps

type State = {
  reset: boolean,
  searching: boolean,
  filteredTransactions: TransactionListTx[]
}

class TransactionListComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      reset: true,
      searching: false,
      filteredTransactions: []
    }
  }

  componentDidMount = () => {
    this.props.fetchMoreTransactions(this.props.selectedWalletId, this.props.selectedCurrencyCode, this.state.reset)
    if (this.state.reset) {
      this.setState({ reset: false })
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (nextProps.selectedWalletId !== this.props.selectedWalletId || nextProps.selectedCurrencyCode !== this.props.selectedCurrencyCode) {
      this.props.fetchMoreTransactions(nextProps.selectedWalletId, nextProps.selectedCurrencyCode, this.state.reset)
      if (this.state.reset) {
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
    getTransactions({
      currencyCode: selectedCurrencyCode,
      searchString
    })
      .then(filteredEdgeTransactions => {
        const filteredTransactions = transactions.filter(transaction => filteredEdgeTransactions.find(item => item.txid === transaction.txid))
        this.setState({ filteredTransactions })
      })
      .catch(error => console.log(error))
  }

  toggleTransactionSearching = (isSearching: boolean) => (isSearching ? this.handleOnRefresh() : this.setState({ searching: false }))

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

    if (receivedFiatSymbol.length !== 1) {
      fiatBalanceString = fiatBalanceFormat
    } else {
      fiatBalanceString = receivedFiatSymbol + ' ' + fiatBalanceFormat
    }
    return (
      <View>
        <TouchableOpacity onPress={this.props.toggleBalanceVisibility} style={styles.touchableBalanceBox} activeOpacity={BALANCE_BOX_OPACITY}>
          <Gradient style={styles.currentBalanceBox}>
            <View style={styles.balanceBoxContents}>
              {!isBalanceVisible ? (
                <View style={styles.totalBalanceWrap}>
                  <View style={styles.hiddenBalanceBoxDollarsWrap}>
                    <T style={styles.currentBalanceBoxHiddenText}>{s.strings.string_show_balance}</T>
                  </View>
                </View>
              ) : (
                <View style={styles.balanceShownContainer}>
                  <View style={styles.iconWrap}>
                    {logo ? (
                      <Image style={{ height: '100%' }} source={{ uri: logo }} resizeMode="cover" />
                    ) : (
                      <T style={styles.request}>{displayDenomination.symbol}</T>
                    )}
                  </View>
                  <View style={styles.currentBalanceBoxBitsWrap}>
                    <View style={{ flexDirection: 'row' }}>
                      {displayDenomination.symbol ? (
                        <View style={{ flexDirection: 'row' }}>
                          <T numberOfLines={1} style={[styles.currentBalanceBoxBits, styles.symbol]}>
                            {displayDenomination.symbol + ' '}
                          </T>
                          <ThemedTicker style={[styles.currentBalanceBoxBits, styles.symbol]}>{cryptoAmountString}</ThemedTicker>
                        </View>
                      ) : (
                        <ThemedTicker style={styles.currentBalanceBoxBits}>{cryptoAmountString}</ThemedTicker>
                      )}

  renderSectionHeader = (section: { section: Section }) => <SectionHeader title={section.section.title} />

  renderTransaction = (transaction: SectionList<TransactionListTx>) => {
    const { selectedWalletId, selectedCurrencyCode } = this.props
    return <TransactionListRow walletId={selectedWalletId} currencyCode={selectedCurrencyCode} transaction={transaction.item} />
  }

  renderTop = () => (
    <Top
      walletId={this.props.selectedWalletId}
      isEmpty={this.props.transactions.length < 1}
      searching={this.state.searching}
      toggleTransactionSearching={this.toggleTransactionSearching}
      onSearchTransaction={this.handleSearchTransaction}
    />
  )

  keyExtractor = (item: TransactionListTx) => String(item.key)
  render() {
    const { filteredTransactions, reset, searching } = this.state
    const transactions = reset ? [] : searching ? filteredTransactions : this.props.transactions
    const checkFilteredTransactions = searching && filteredTransactions.length === 0
    return (
      <SceneWrapper>
        <SectionList
          sections={checkFilteredTransactions ? this.emptySection() : this.section(transactions)}
          renderItem={this.renderTransaction}
          renderSectionHeader={this.renderSectionHeader}
          initialNumToRender={INITIAL_TRANSACTION_BATCH_NUMBER}
          onEndReached={this.handleScrollEnd}
          onEndReachedThreshold={SCROLL_THRESHOLD}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={this.renderEmptyComponent}
          ListHeaderComponent={this.renderTop}
          contentOffset={{ y: !searching && transactions.length > 0 ? this.props.theme.rem(4.5) : 0 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={this.handleOnRefresh} />}
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
    const { currencyWallets = {} } = state.core.account
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
    fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => dispatch(fetchMoreTransactions(walletId, currencyCode, reset))
  })
)(withTheme(TransactionListComponent))
