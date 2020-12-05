// @flow

import * as React from 'react'
import { ActivityIndicator, SectionList, View } from 'react-native'

import s from '../../locales/strings'
import type { TransactionListTx } from '../../types/types.js'
import { BuyCrypto } from '../common/BuyCrypto.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { TransactionRow } from '../common/TransactionRow.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { TransactionListTop } from '../themed/TransactionListTop.js'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5

type Section = {
  title: string,
  data: TransactionListTx[]
}

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

  keyExtractor = (item: TransactionListTx) => String(item.key)
  render() {
    const transactions = this.state.reset ? [] : this.props.transactions
    return (
      <SceneWrapper>
        <SectionList
          sections={this.section(transactions)}
          renderItem={this.renderTransaction}
          renderSectionHeader={this.renderSectionHeader}
          renderSectionFooter={() => <View style={{ height: this.props.theme.rem(0.5) }} />}
          initialNumToRender={INITIAL_TRANSACTION_BATCH_NUMBER}
          onEndReached={this.handleScrollEnd}
          onEndReachedThreshold={SCROLL_THRESHOLD}
          keyExtractor={this.keyExtractor}
          ListEmptyComponent={this.renderEmptyComponent}
          ListHeaderComponent={this.renderHeader()}
        />
      </SceneWrapper>
    )
  }

  renderHeader = () => {
    return this.props.loading ? <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size="large" /> : <TransactionListTop />
  }

  renderSectionHeader = (section: { section: Section }) => {
    const styles = getStyles(this.props.theme)
    return (
      <View style={styles.headerContainer}>
        <EdgeText style={styles.formattedDate}>{section.section.title}</EdgeText>
      </View>
    )
  }

  renderTransaction = (transaction: SectionList<TransactionListTx>) => {
    const { selectedWalletId, selectedCurrencyCode } = this.props
    return <TransactionRow walletId={selectedWalletId} currencyCode={selectedCurrencyCode} transaction={transaction} />
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.rem(10)
  },
  headerContainer: {
    // marginTop: theme.rem(0.5),
    marginBottom: theme.rem(0.125),
    backgroundColor: theme.tileBackground,
    padding: theme.rem(0.25)
  },
  formattedDate: {
    marginVertical: theme.rem(0.25),
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const TransactionList = withTheme(TransactionListComponent)
