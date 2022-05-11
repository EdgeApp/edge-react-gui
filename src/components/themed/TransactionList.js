// @flow

import * as React from 'react'
import { RefreshControl, SectionList } from 'react-native'

import { fetchMoreTransactions } from '../../actions/TransactionListActions'
import s from '../../locales/strings'
import { useCallback, useEffect, useMemo, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import type { TransactionListTx } from '../../types/types.js'
import { showError } from '../services/AirshipInstance.js'
import { useTheme } from '../services/ThemeContext.js'
import { BuyCrypto } from '../themed/BuyCrypto.js'
import { EmptyLoader, SectionHeader, SectionHeaderCentered } from '../themed/TransactionListComponents.js'
import { TransactionListRow } from '../themed/TransactionListRow.js'

const INITIAL_TRANSACTION_BATCH_NUMBER = 10
const SCROLL_THRESHOLD = 0.5

type Section = {
  title: string,
  data: TransactionListTx[]
}
type Props = {
  walletId: string,
  currencyCode: string,
  searching?: boolean,
  searchString?: string
}

export function TransactionList({ walletId, currencyCode, searching = false, searchString }: Props) {
  const dispatch = useDispatch()

  const theme = useTheme()

  const { getNumTransactions, getTransactions } = useSelector(state => state.core.account.currencyWallets[walletId])

  const [transactions, setTransactions] = useState([])
  const [reset, setReset] = useState(true)
  const [numTransactions, setNumTransactions] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getNumTransactions().then(setNumTransactions).catch(showError)
  }, [getNumTransactions])

  useEffect(() => {
    if (reset) {
      setTransactions([])
      return
    }
    if (!searching || searchString == null || searchString === '') {
      dispatch(fetchMoreTransactions(walletId, currencyCode, reset))
        .then(txList => {
          setTransactions(txList)
          if (reset) setReset(false)
        })
        .catch(showError)

      return
    }
    setLoading(true)
    getTransactions({
      currencyCode: currencyCode,
      searchString
    })
      .then()
      .catch(showError)
      .finally(() => {
        setLoading(false)
      })
  }, [searchString, currencyCode, transactions, getTransactions, searching, reset, dispatch, walletId])
  const renderTransaction = useCallback(
    (transaction: SectionList<TransactionListTx>) => {
      return <TransactionListRow walletId={walletId} currencyCode={currencyCode} transaction={transaction.item} />
    },
    [walletId, currencyCode]
  )

  const renderSectionHeader = useCallback(
    (section: { section: Section }) => {
      const checkFilteredTransactions = searching && transactions.length === 0
      if (checkFilteredTransactions || loading) {
        return <SectionHeaderCentered title={section.section.title} loading={loading} />
      }
      return <SectionHeader title={section.section.title} />
    },
    [transactions, loading, searching]
  )

  const handleScrollEnd = useCallback(() => {
    dispatch(fetchMoreTransactions(walletId, currencyCode, reset))
    if (reset) setReset(false)
  }, [walletId, currencyCode, reset, dispatch])

  const keyExtractor = (item: TransactionListTx) => `${item.key}`

  const renderEmptyComponent = useCallback(() => {
    numTransactions ? <EmptyLoader /> : <BuyCrypto walletId={walletId} currencyCode={currencyCode} />
  }, [walletId, currencyCode, numTransactions])

  const refreshControl = useMemo(
    () =>
      transactions.length !== 0 ? (
        <RefreshControl refreshing={false} onRefresh={this.handleOnRefresh} tintColor={this.props.theme.searchListRefreshControlIndicator} />
      ) : undefined,
    [transactions]
  )

  const sections = useMemo(() => {
    if ((searching && transactions.length === 0) || loading) {
      return [{ title: s.strings.transaction_list_search_no_result, data: [] }]
    }
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
  }, [searching, transactions, loading])

  const contentOffset = useMemo(
    () => ({
      y: !searching && transactions.length > 0 ? theme.rem(4.5) : 0
    }),
    [searching, transactions, theme]
  )

  return (
    <SectionList
      sections={sections}
      renderItem={renderTransaction}
      renderSectionHeader={renderSectionHeader}
      initialNumToRender={INITIAL_TRANSACTION_BATCH_NUMBER}
      onEndReached={handleScrollEnd}
      onEndReachedThreshold={SCROLL_THRESHOLD}
      keyExtractor={keyExtractor}
      ListEmptyComponent={renderEmptyComponent}
      contentOffset={contentOffset}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
    />
  )
}
