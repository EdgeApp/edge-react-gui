// @flow

import * as React from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'

import type { TransactionListTx } from '../../types/types.js'
import { BuyCrypto } from '../common/BuyCrypto.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { TransactionRow } from '../common/TransactionRow.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { TransactionListTop } from '../themed/TransactionListTop.js'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5

export type StateProps = {
  loading: boolean,
  transactions: TransactionListTx[],
  selectedWalletId: string,
  numTransactions: number,
  selectedCurrencyCode: string
}

export type DispatchProps = {
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => any
}

type Props = StateProps & DispatchProps & ThemeProps

type State = {
  reset: boolean
}

const emptyArray = []

class TransactionListComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      reset: true
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

  renderEmptyComponent = () => {
    const styles = getStyles(this.props.theme)
    if (this.props.numTransactions) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
        </View>
      )
    }
    return <BuyCrypto walletId={this.props.selectedWalletId} currencyCode={this.props.selectedCurrencyCode} />
  }

  render() {
    const txs = this.state.reset ? emptyArray : this.props.transactions
    const styles = getStyles(this.props.theme)
    return (
      <SceneWrapper>
        <FlatList
          ListEmptyComponent={this.renderEmptyComponent}
          ListHeaderComponent={this.renderHeader()}
          style={styles.transactionsScrollWrap}
          data={txs}
          renderItem={this.renderTx}
          initialNumToRender={INITIAL_TRANSACTION_BATCH_NUMBER}
          onEndReached={this.handleScrollEnd}
          onEndReachedThreshold={SCROLL_THRESHOLD}
          keyExtractor={item => item.key.toString()}
        />
      </SceneWrapper>
    )
  }

  renderHeader = () => {
    return this.props.loading ? <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size="large" /> : <TransactionListTop />
  }

  renderTx = (transactionListItem: FlatList<TransactionListTx>) => {
    const { selectedWalletId, selectedCurrencyCode, transactions } = this.props
    const transaction = transactionListItem.item
    const isHeader = transaction.key === 0 || transaction.dateString !== transactions[transaction.key - 1].dateString
    return <TransactionRow currencyId={selectedWalletId} currencyCode={selectedCurrencyCode} transaction={transaction} isHeader={isHeader} />
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  transactionsScrollWrap: {
    flex: 1
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(10)
  }
}))

export const TransactionList = withTheme(TransactionListComponent)
