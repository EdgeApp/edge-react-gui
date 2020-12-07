// @flow

import * as React from 'react'
import { SectionList } from 'react-native'
import { connect } from 'react-redux'

import { fetchMoreTransactions } from '../../actions/TransactionListActions'
import s from '../../locales/strings'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import type { TransactionListTx } from '../../types/types.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { BuyCrypto } from '../themed/BuyCrypto.js'
import { EmptyLoader, SectionFooter, SectionHeader, Top } from '../themed/TransactionListComponents.js'
import { TransactionListRow } from '../themed/TransactionListRow.js'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5

type Section = {
  title: string,
  data: TransactionListTx[]
}

export type StateProps = {
  numTransactions: number,
  selectedWalletId: string,
  selectedCurrencyCode: string,
  transactions: TransactionListTx[]
}

export type DispatchProps = {
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => any
}

type Props = StateProps & DispatchProps

type State = {
  reset: boolean
}

class TransactionListComponent extends React.PureComponent<Props, State> {
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

  renderEmptyComponent = () =>
    this.props.numTransactions ? <EmptyLoader /> : <BuyCrypto walletId={this.props.selectedWalletId} currencyCode={this.props.selectedCurrencyCode} />

  renderSectionHeader = (section: { section: Section }) => <SectionHeader title={section.section.title} />

  renderTransaction = (transaction: SectionList<TransactionListTx>) => {
    const { selectedWalletId, selectedCurrencyCode } = this.props
    return <TransactionListRow walletId={selectedWalletId} currencyCode={selectedCurrencyCode} transaction={transaction.item} />
  }

  renderTop = () => <Top walletId={this.props.selectedWalletId} isEmpty={this.props.transactions.length < 1} />

  renderSectionFooter = () => <SectionFooter />

  keyExtractor = (item: TransactionListTx) => String(item.key)
  render() {
    const transactions = this.state.reset ? [] : this.props.transactions
    return (
      <SceneWrapper>
        <SectionList
          sections={this.section(transactions)}
          renderItem={this.renderTransaction}
          renderSectionHeader={this.renderSectionHeader}
          renderSectionFooter={this.renderSectionFooter}
          initialNumToRender={INITIAL_TRANSACTION_BATCH_NUMBER}
          onEndReached={this.handleScrollEnd}
          onEndReachedThreshold={SCROLL_THRESHOLD}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={this.renderEmptyComponent}
          ListHeaderComponent={this.renderTop}
        />
      </SceneWrapper>
    )
  }
}

export const TransactionList = connect(
  (state: RootState) => ({
    numTransactions: state.ui.scenes.transactionList.numTransactions,
    selectedCurrencyCode: state.ui.wallets.selectedCurrencyCode,
    selectedWalletId: state.ui.wallets.selectedWalletId,
    transactions: state.ui.scenes.transactionList.transactions
  }),
  (dispatch: Dispatch): DispatchProps => ({
    fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => dispatch(fetchMoreTransactions(walletId, currencyCode, reset))
  })
)(TransactionListComponent)
