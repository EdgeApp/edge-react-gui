import { FlashList } from '@shopify/flash-list'
import { lt } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenMap, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { RefreshControl } from 'react-native'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useTransactionList } from '../../hooks/useTransactionList'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { calculateSpamThreshold, unixToLocaleDateTime, zeroString } from '../../util/utils'
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { useTheme } from '../services/ThemeContext'
import { BuyCrypto } from '../themed/BuyCrypto'
import { ExplorerCard } from '../themed/ExplorerCard'
import { EmptyLoader, SectionHeader, SectionHeaderCentered } from '../themed/TransactionListComponents'
import { TransactionListRow } from '../themed/TransactionListRow'
import { TransactionListTop } from '../themed/TransactionListTop'
import { ExchangedFlipInputTester } from './ExchangedFlipInputTester'

const SHOW_FLIP_INPUT_TESTER = false

export interface TransactionListParams {
  walletId: string
  tokenId: string | undefined
}

interface Props extends EdgeSceneProps<'transactionList'> {
  wallet: EdgeCurrencyWallet
}

function TransactionListComponent(props: Props) {
  const { navigation, route, wallet } = props
  const theme = useTheme()

  const tokenId = checkToken(route.params.tokenId, wallet.currencyConfig.allTokens)
  const { pluginId } = wallet.currencyInfo
  const { currencyCode } = tokenId == null ? wallet.currencyInfo : wallet.currencyConfig.allTokens[tokenId]

  // State:
  const flashList = React.useRef<FlashList<ListItem>>(null)
  const [searching, setSearching] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')

  // Selectors:
  const exchangeDenom = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode))
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${wallet.fiatCurrencyCode}`])
  const spamFilterOn = useSelector(state => state.ui.settings.spamFilterOn)

  // Watchers:
  const enabledTokenIds = useWatch(wallet, 'enabledTokenIds')
  const transactionList = useTransactionList(wallet, tokenId, searching ? searchText : undefined)
  const { transactions, atEnd, requestMore: handleScrollEnd } = transactionList

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const spamThreshold = React.useMemo<string | undefined>(() => {
    if (spamFilterOn && !zeroString(exchangeRate)) {
      return calculateSpamThreshold(exchangeRate, exchangeDenom)
    }
  }, [exchangeDenom, exchangeRate, spamFilterOn])

  const { isTransactionListUnsupported = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}

  // Assemble the data for the section list:
  type ListItem = EdgeTransaction | string | null
  const listItems = React.useMemo(() => {
    if (isTransactionListUnsupported) return []

    let lastSection = ''
    const out: ListItem[] = []
    for (const tx of transactions) {
      // Skip spam transactions:
      if (!tx.isSend && spamThreshold != null && lt(tx.nativeAmount, spamThreshold)) {
        continue
      }

      // Create a new section header if we need one:
      const { date } = unixToLocaleDateTime(tx.date)
      if (date !== lastSection) {
        out.push(date)
        lastSection = date
      }

      // Add the transaction to the list:
      out.push(tx)
    }

    // If we are still loading, add a spinner at the end:
    if (!atEnd) out.push(null)

    return out
  }, [atEnd, isTransactionListUnsupported, spamThreshold, transactions])

  // Figure out where the section headers are located:
  const stickyHeaderIndices = React.useMemo<number[]>(() => {
    const out: number[] = []
    for (let i = 0; i < listItems.length; ++i) {
      if (typeof listItems[i] === 'string') out.push(i)
    }
    return out
  }, [listItems])

  // ---------------------------------------------------------------------------
  // Side-Effects
  // ---------------------------------------------------------------------------

  // Navigate back if the token is disabled from Archive Wallet action
  React.useEffect(() => {
    if (tokenId != null && !enabledTokenIds.includes(tokenId)) {
      navigation.goBack()
    }
  }, [enabledTokenIds, navigation, tokenId])

  // Hide the search box when not in use,
  // and we have received our first batch of core transactions:
  const hideSearch = !searching && listItems.length > 1
  React.useEffect(() => {
    if (hideSearch) {
      // There is a lag between updating the items and re-rendering the list,
      // so we need to let that settle:
      requestAnimationFrame(() => {
        flashList.current?.scrollToOffset({
          animated: true,
          offset: theme.rem(4.5)
        })
      })
    }
  }, [hideSearch, theme])

  // ---------------------------------------------------------------------------
  // Renderers
  // ---------------------------------------------------------------------------

  const refreshControl = React.useMemo(() => {
    return (
      <RefreshControl
        refreshing={false}
        tintColor={theme.searchListRefreshControlIndicator}
        // useHandler isn't needed, since we're already in useMemo:
        onRefresh={() => setSearching(true)}
      />
    )
  }, [theme])

  const topArea = React.useMemo(() => {
    return (
      <TransactionListTop
        isEmpty={listItems.length < 1}
        navigation={navigation}
        searching={searching}
        tokenId={tokenId}
        wallet={wallet}
        onSearchingChange={setSearching}
        onSearchTextChange={setSearchText}
      />
    )
  }, [listItems.length, navigation, searching, tokenId, wallet])

  const emptyComponent = React.useMemo(() => {
    if (isTransactionListUnsupported) {
      return <ExplorerCard wallet={wallet} tokenId={tokenId} />
    } else if (searching) {
      return <SectionHeaderCentered title={lstrings.transaction_list_search_no_result} />
    } else {
      return <BuyCrypto navigation={navigation} wallet={wallet} tokenId={tokenId} />
    }
  }, [isTransactionListUnsupported, navigation, searching, tokenId, wallet])

  const renderItem = useHandler(({ item }: FlatListItem<ListItem>) => {
    if (item == null) {
      return <EmptyLoader />
    }
    if (typeof item === 'string') {
      return <SectionHeader title={item} />
    }
    return <TransactionListRow currencyCode={currencyCode} navigation={navigation} transaction={item} wallet={wallet} />
  })

  const getItemType = useHandler((item: ListItem) => {
    if (item == null) return 'spinner'
    if (typeof item === 'string') return 'header'
    return 'tx'
  })

  const keyExtractor = useHandler((item: ListItem) => {
    if (item == null) return 'spinner'
    if (typeof item === 'string') return item
    return item.txid
  })

  return (
    <NotificationSceneWrapper navigation={navigation} hasTabs scroll>
      {(gap, notificationHeight) => (
        <>
          {SHOW_FLIP_INPUT_TESTER ? (
            <ExchangedFlipInputTester />
          ) : (
            <FlashList
              ref={flashList}
              contentContainerStyle={{ paddingBottom: notificationHeight }}
              data={listItems}
              estimatedItemSize={theme.rem(4.25)}
              getItemType={getItemType}
              keyboardShouldPersistTaps="handled"
              keyExtractor={keyExtractor}
              ListEmptyComponent={emptyComponent}
              ListHeaderComponent={topArea}
              onEndReachedThreshold={0.5}
              refreshControl={refreshControl}
              renderItem={renderItem}
              stickyHeaderIndices={stickyHeaderIndices}
              onEndReached={handleScrollEnd}
            />
          )}
        </>
      )}
    </NotificationSceneWrapper>
  )
}

/**
 * If the token gets deleted, the scene will crash.
 * Fall back to the main currency code if this happens.
 */
function checkToken(tokenId: string | undefined, allTokens: EdgeTokenMap): string | undefined {
  if (tokenId == null) return undefined
  if (allTokens[tokenId] == null) return undefined
  return tokenId
}

export const TransactionList = withWallet(TransactionListComponent)
