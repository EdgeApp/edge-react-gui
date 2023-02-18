import { lt } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { RefreshControl, SectionList } from 'react-native'
import { useDispatch } from 'react-redux'

import { fetchMoreTransactions } from '../../actions/TransactionListActions'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import s from '../../locales/strings'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { FlatListItem, TransactionListTx } from '../../types/types'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { calculateSpamThreshold, isReceivedTransaction, zeroString } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { ThemeProps, useTheme } from '../services/ThemeContext'
import { BuyCrypto } from '../themed/BuyCrypto'
import { ExplorerCard } from '../themed/ExplorerCard'
import { EmptyLoader, SectionHeader, SectionHeaderCentered } from '../themed/TransactionListComponents'
import { TransactionListRow } from '../themed/TransactionListRow'
import { TransactionListTop } from '../themed/TransactionListTop'
import { ExchangedFlipInputTester } from './ExchangedFlipInputTester'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5
const SHOW_FLIP_INPUT_TESTER = false

interface Section {
  title: string
  data: TransactionListTx[]
}

interface StateProps {
  numTransactions: number
  wallet: EdgeCurrencyWallet
  currencyCode: string
  spamThreshold?: string
  tokenId?: string
  transactions: TransactionListTx[]
}

interface DispatchProps {
  fetchMoreTransactions: (reset: boolean) => void
}

interface OwnProps {
  navigation: NavigationProp<'transactionList'>
  route: RouteProp<'transactionList'>
  wallet: EdgeCurrencyWallet
}

type Props = StateProps & DispatchProps & ThemeProps & OwnProps

interface State {
  reset: boolean
  searching: boolean
  filteredTransactions: TransactionListTx[]
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
    this.props.fetchMoreTransactions(this.state.reset)
    if (this.state.reset) {
      this.setState({ reset: false })
    }
  }

  componentDidUpdate(prevProps: Props) {
    const walletIdChanged = prevProps.wallet.id !== this.props.wallet.id
    const currencyCodeChanged = prevProps.currencyCode !== this.props.currencyCode

    if (walletIdChanged || currencyCodeChanged) {
      this.props.fetchMoreTransactions(this.state.reset)
      if (this.state.reset) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ reset: false })
      }
    }
  }

  isUnsupported(): boolean {
    return SPECIAL_CURRENCY_INFO[this.props.wallet.currencyInfo.pluginId].isTransactionListUnsupported === true
  }

  handleScrollEnd = () => {
    this.props.fetchMoreTransactions(this.state.reset)
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
    const { navigation, tokenId, numTransactions, wallet } = this.props

    if (this.isUnsupported()) {
      return <ExplorerCard wallet={wallet} tokenId={tokenId} />
    } else if (numTransactions > 0) {
      return <EmptyLoader />
    } else {
      return <BuyCrypto navigation={navigation} wallet={wallet} tokenId={tokenId} />
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
    const { navigation, wallet, currencyCode, spamThreshold } = this.props
    if (spamThreshold != null && isReceivedTransaction(transaction.item) && lt(transaction.item.nativeAmount, spamThreshold)) {
      return null
    }
    return <TransactionListRow navigation={navigation} wallet={wallet} currencyCode={currencyCode} transaction={transaction.item} />
  }

  renderTop = () => {
    const { currencyCode, navigation, tokenId, wallet } = this.props
    const { searching } = this.state

    return (
      <TransactionListTop
        navigation={navigation}
        currencyCode={currencyCode}
        isEmpty={this.isUnsupported() || this.props.transactions.length < 1}
        searching={searching}
        tokenId={tokenId}
        wallet={wallet}
        onChangeSortingState={this.handleChangeSortingState}
        onSearchTransaction={this.handleSearchTransaction}
      />
    )
  }

  keyExtractor = (item: TransactionListTx) => item.txid

  getItemLayout = (data: unknown, index: number) => ({
    length: this.props.theme.rem(4.25),
    offset: this.props.theme.rem(4.25) * index,
    index
  })

  render() {
    const { filteredTransactions, loading, reset, searching } = this.state
    const transactions = this.isUnsupported() || reset ? [] : searching ? filteredTransactions : this.props.transactions
    const checkFilteredTransactions = searching && filteredTransactions.length === 0
    return (
      <SceneWrapper>
        {SHOW_FLIP_INPUT_TESTER ? (
          <ExchangedFlipInputTester />
        ) : (
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
            stickySectionHeadersEnabled
          />
        )}
      </SceneWrapper>
    )
  }
}

export const TransactionList = withWallet((props: OwnProps) => {
  const { wallet, route } = props
  const { walletId, currencyCode } = route.params
  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const numTransactions = useSelector(state => state.ui.scenes.transactionList.numTransactions)
  const transactions = useSelector(state => state.ui.scenes.transactionList.transactions)
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${wallet.fiatCurrencyCode}`])
  const exchangeDenom = useSelector(state => getExchangeDenomination(state, wallet.currencyInfo.pluginId, currencyCode))

  let spamThreshold
  const spamFilterOn = useSelector(state => state.ui.settings.spamFilterOn)
  if (spamFilterOn && !zeroString(exchangeRate)) {
    spamThreshold = calculateSpamThreshold(exchangeRate, exchangeDenom)
  }

  const tokenId = getTokenId(account, wallet.currencyInfo.pluginId, currencyCode)

  const handleMoreTransactions = useHandler((reset: boolean): void => {
    dispatch(fetchMoreTransactions(walletId, currencyCode, reset))
  })

  return (
    <TransactionListComponent
      {...props}
      currencyCode={currencyCode}
      numTransactions={numTransactions}
      spamThreshold={spamThreshold}
      tokenId={tokenId}
      theme={theme}
      transactions={transactions}
      fetchMoreTransactions={handleMoreTransactions}
    />
  )
})
