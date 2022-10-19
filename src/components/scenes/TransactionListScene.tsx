import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { RefreshControl, SectionList } from 'react-native'

import { fetchMoreTransactions } from '../../actions/TransactionListActions'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { FlatListItem, TransactionListTx } from '../../types/types'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { ThemeProps, withTheme } from '../services/ThemeContext'
import { BuyCrypto } from '../themed/BuyCrypto'
import { EmptyLoader, SectionHeader, SectionHeaderCentered, Top } from '../themed/TransactionListComponents'
import { TransactionListRow } from '../themed/TransactionListRow'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5

type Section = {
  title: string
  data: TransactionListTx[]
}

type StateProps = {
  numTransactions: number
  wallet: EdgeCurrencyWallet
  currencyCode: string
  tokenId?: string
  transactions: TransactionListTx[]
}

type DispatchProps = {
  fetchMoreTransactions: (walletId: string, currencyCode: string, reset: boolean) => void
}

type OwnProps = {
  navigation: NavigationProp<'transactionList'>
  route: RouteProp<'transactionList'>
}

type Props = StateProps & DispatchProps & ThemeProps & OwnProps

type State = {
  isTransactionListUnsupported: boolean
  reset: boolean
  searching: boolean
  filteredTransactions: TransactionListTx[]
  loading: boolean
}

class TransactionListComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      isTransactionListUnsupported: false,
      reset: true,
      searching: false,
      filteredTransactions: [],
      loading: false
    }
  }

  componentDidMount = () => {
    this.props.fetchMoreTransactions(this.props.wallet.id, this.props.currencyCode, this.state.reset)
    if (this.state.reset) {
      this.setState({ reset: false })
    }

    if (this.props.wallet != null && !!SPECIAL_CURRENCY_INFO[this.props.wallet.currencyInfo.pluginId].isTransactionListUnsupported) {
      this.setState({ isTransactionListUnsupported: true })
    }
  }

  componentDidUpdate(prevProps: Props) {
    const walletIdChanged = prevProps.wallet.id !== this.props.wallet.id
    const currencyCodeChanged = prevProps.currencyCode !== this.props.currencyCode

    if (walletIdChanged || currencyCodeChanged) {
      this.props.fetchMoreTransactions(this.props.wallet.id, this.props.currencyCode, this.state.reset)
      if (this.state.reset) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ reset: false })
      }
    }
  }

  handleScrollEnd = () => {
    this.props.fetchMoreTransactions(this.props.wallet.id, this.props.currencyCode, this.state.reset)
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
    const { wallet, currencyCode, transactions } = this.props

    this.setState({ loading: true })
    wallet
      .getTransactions({
        currencyCode,
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
      const dateString = transaction.dateString
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

  renderEmptyComponent = () => {
    const { tokenId, numTransactions, wallet } = this.props
    if (numTransactions > 0) {
      return <EmptyLoader />
    } else {
      return <BuyCrypto wallet={wallet} tokenId={tokenId} />
    }
  }

  renderSectionHeader = (section: { section: Section }) => {
    const { filteredTransactions, loading, searching } = this.state
    const checkFilteredTransactions = searching && filteredTransactions.length === 0
    if (checkFilteredTransactions || loading) {
      return <SectionHeaderCentered title={section.section.title} loading={loading} />
    }
    return <SectionHeader title={section.section.title} />
  }

  renderTransaction = (transaction: FlatListItem<TransactionListTx>) => {
    const { wallet, currencyCode } = this.props
    return <TransactionListRow walletId={wallet.id} currencyCode={currencyCode} transaction={transaction.item} />
  }

  renderTop = () => {
    const { wallet } = this.props
    const { isTransactionListUnsupported } = this.state

    return (
      <Top
        walletId={wallet.id}
        isEmpty={isTransactionListUnsupported || this.props.transactions.length < 1}
        searching={this.state.searching}
        navigation={this.props.navigation}
        tokenId={this.props.tokenId}
        onChangeSortingState={this.handleChangeSortingState}
        onSearchTransaction={this.handleSearchTransaction}
      />
    )
  }

  keyExtractor = (item: TransactionListTx) => item.txid

  getItemLayout = (data: any, index: number) => ({ length: this.props.theme.rem(4.25), offset: this.props.theme.rem(4.25) * index, index })

  render() {
    const { filteredTransactions, loading, reset, searching, isTransactionListUnsupported } = this.state
    const transactions = isTransactionListUnsupported || reset ? [] : searching ? filteredTransactions : this.props.transactions
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
          contentOffset={{ x: 0, y: !searching && transactions.length > 0 ? this.props.theme.rem(4.5) : 0 }}
          refreshControl={
            transactions.length !== 0 ? (
              <RefreshControl refreshing={false} onRefresh={this.handleOnRefresh} tintColor={this.props.theme.searchListRefreshControlIndicator} />
            ) : undefined
          }
          keyboardShouldPersistTaps="handled"
          getItemLayout={this.getItemLayout}
        />
      </SceneWrapper>
    )
  }
}

export const TransactionList = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => {
    const { walletId, currencyCode } = ownProps.route.params

    // getTransactions
    const { currencyWallets } = state.core.account
    const currencyWallet = currencyWallets[walletId]
    const tokenId = getTokenId(state.core.account, currencyWallet.currencyInfo.pluginId, currencyCode)

    return {
      numTransactions: state.ui.scenes.transactionList.numTransactions,
      currencyCode,
      wallet: currencyWallet,
      tokenId,
      transactions: state.ui.scenes.transactionList.transactions
    }
  },
  dispatch => ({
    fetchMoreTransactions(walletId: string, currencyCode: string, reset: boolean) {
      dispatch(fetchMoreTransactions(walletId, currencyCode, reset))
    }
  })
)(withTheme(TransactionListComponent))
