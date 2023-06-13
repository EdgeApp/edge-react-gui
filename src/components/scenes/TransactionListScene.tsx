import { gte } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { RefreshControl, SectionList } from 'react-native'

import { fetchMoreTransactions } from '../../actions/TransactionListActions'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { calculateSpamThreshold, unixToLocaleDateTime, zeroString } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { useTheme } from '../services/ThemeContext'
import { BuyCrypto } from '../themed/BuyCrypto'
import { ExplorerCard } from '../themed/ExplorerCard'
import { EmptyLoader, SectionHeader, SectionHeaderCentered } from '../themed/TransactionListComponents'
import { TransactionListRow } from '../themed/TransactionListRow'
import { TransactionListTop } from '../themed/TransactionListTop'
import { ExchangedFlipInputTester } from './ExchangedFlipInputTester'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5
const SHOW_FLIP_INPUT_TESTER = false

export interface TransactionListParams {
  walletId: string
  tokenId: string | undefined
}

interface Section {
  title: string
  data: EdgeTransaction[]
}

interface Props extends EdgeSceneProps<'transactionList'> {
  wallet: EdgeCurrencyWallet
}

function TransactionListComponent(props: Props) {
  const { navigation, route, wallet } = props
  const { tokenId } = route.params
  const { pluginId } = wallet.currencyInfo

  const dispatch = useDispatch()
  const theme = useTheme()

  const { currencyCode } = tokenId == null ? wallet.currencyInfo : wallet.currencyConfig.allTokens[tokenId]

  // State:
  const [filteredTransactions, setFilteredTransactions] = React.useState<EdgeTransaction[]>([])
  const [loading, setLoading] = React.useState(false)
  const [reset, setReset] = React.useState(true)
  const [searching, setSearching] = React.useState(false)

  // Selectors:
  const exchangeDenom = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode))
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${wallet.fiatCurrencyCode}`])
  const numTransactions = useSelector(state => state.ui.transactionList.numTransactions)
  const spamFilterOn = useSelector(state => state.ui.settings.spamFilterOn)
  const transactions = useSelector(state => state.ui.transactionList.transactions)

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const spamThreshold = React.useMemo<string | undefined>(() => {
    if (spamFilterOn && !zeroString(exchangeRate)) {
      return calculateSpamThreshold(exchangeRate, exchangeDenom)
    }
  }, [exchangeDenom, exchangeRate, spamFilterOn])

  const enabledTokenIds = useWatch(wallet, 'enabledTokenIds')

  const { isTransactionListUnsupported = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}

  const finalTransactions = React.useMemo(() => {
    if (isTransactionListUnsupported || reset) return []
    if (searching) return filteredTransactions
    return transactions
  }, [filteredTransactions, isTransactionListUnsupported, reset, searching, transactions])

  const contentOffset = React.useMemo(
    () => ({
      x: 0,
      y: !searching && finalTransactions.length > 0 ? theme.rem(4.5) : 0
    }),
    [finalTransactions.length, searching, theme]
  )

  const sections = React.useMemo(() => {
    if (loading || (searching && finalTransactions.length === 0)) {
      return [{ title: lstrings.transaction_list_search_no_result, data: [] }]
    }

    // Spam filter:
    const transactions = finalTransactions.filter(tx => {
      if (tx.isSend) return true
      if (spamThreshold == null) return true
      return gte(tx.nativeAmount, spamThreshold)
    })

    // Headers:
    const sections: Section[] = []
    for (const transaction of transactions) {
      const { date: dateString } = unixToLocaleDateTime(transaction.date)
      const section = sections.find(section => section.title === dateString)
      if (section == null) {
        sections.push({
          title: dateString,
          data: [transaction]
        })
      } else {
        section.data.push(transaction)
      }
    }
    return sections
  }, [finalTransactions, loading, searching, spamThreshold])

  // ---------------------------------------------------------------------------
  // Side-Effects
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    dispatch(fetchMoreTransactions(wallet, currencyCode, reset))
    if (reset) {
      setReset(false)
    }
  }, [currencyCode, dispatch, reset, wallet])

  // Navigate back if the token is disabled from Archive Wallet action
  React.useEffect(() => {
    if (tokenId != null && !enabledTokenIds.includes(tokenId)) {
      navigation.goBack()
    }
  }, [enabledTokenIds, navigation, tokenId])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleScrollEnd = useHandler(() => {
    dispatch(fetchMoreTransactions(wallet, currencyCode, reset))
    if (reset) setReset(false)
  })

  const handleOnRefresh = useHandler(() => {
    if (!searching) {
      setFilteredTransactions(transactions)
      setSearching(true)
    }
  })

  const handleSearchTransaction = useHandler((searchString: string) => {
    setLoading(true)
    wallet
      .getTransactions({
        currencyCode,
        searchString
      })
      .then(filteredEdgeTransactions => {
        setFilteredTransactions(
          transactions.filter(transaction => {
            return filteredEdgeTransactions.find(item => item.txid === transaction.txid)
          })
        )
        setLoading(false)
      })
      .catch(error => {
        setLoading(false)
        console.log(error)
      })
  })

  const handleChangeSortingState = useHandler((isSearching: boolean) => {
    if (isSearching) return handleOnRefresh()
    setSearching(false)
  })

  // ---------------------------------------------------------------------------
  // Renderers
  // ---------------------------------------------------------------------------

  const refreshControl = React.useMemo(() => {
    if (finalTransactions.length === 0) return undefined
    return <RefreshControl refreshing={false} tintColor={theme.searchListRefreshControlIndicator} onRefresh={handleOnRefresh} />
  }, [finalTransactions.length, handleOnRefresh, theme])

  const renderEmptyComponent = useHandler(() => {
    if (isTransactionListUnsupported) {
      return <ExplorerCard wallet={wallet} tokenId={tokenId} />
    } else if (numTransactions > 0) {
      return <EmptyLoader />
    } else {
      return <BuyCrypto navigation={navigation} wallet={wallet} tokenId={tokenId} />
    }
  })

  const renderSectionHeader = useHandler((section: { section: Section }) => {
    const checkFilteredTransactions = searching && filteredTransactions.length === 0
    if (checkFilteredTransactions || loading) {
      return <SectionHeaderCentered title={section.section.title} loading={loading} />
    }
    return <SectionHeader title={section.section.title} />
  })

  const renderTransaction = useHandler((transaction: FlatListItem<EdgeTransaction>) => {
    return <TransactionListRow navigation={navigation} wallet={wallet} currencyCode={currencyCode} transaction={transaction.item} />
  })

  const renderTop = useHandler(() => {
    return (
      <TransactionListTop
        isEmpty={isTransactionListUnsupported || transactions.length < 1}
        navigation={navigation}
        searching={searching}
        tokenId={tokenId}
        wallet={wallet}
        onChangeSortingState={handleChangeSortingState}
        onSearchTransaction={handleSearchTransaction}
      />
    )
  })

  const keyExtractor = useHandler((item: EdgeTransaction) => item.txid)

  const getItemLayout = useHandler((data: unknown, index: number) => ({
    length: theme.rem(4.25),
    offset: theme.rem(4.25) * index,
    index
  }))

  return (
    <SceneWrapper hasTabs>
      {SHOW_FLIP_INPUT_TESTER ? (
        <ExchangedFlipInputTester />
      ) : (
        <SectionList
          contentOffset={contentOffset}
          getItemLayout={getItemLayout}
          initialNumToRender={INITIAL_TRANSACTION_BATCH_NUMBER}
          keyboardShouldPersistTaps="handled"
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmptyComponent}
          ListHeaderComponent={renderTop}
          onEndReachedThreshold={SCROLL_THRESHOLD}
          refreshControl={refreshControl}
          renderItem={renderTransaction}
          renderSectionHeader={renderSectionHeader}
          sections={sections}
          stickySectionHeadersEnabled
          onEndReached={handleScrollEnd}
        />
      )}
    </SceneWrapper>
  )
}

export const TransactionList = withWallet(TransactionListComponent)
