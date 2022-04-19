// @flow

import * as React from 'react'

import { useCallback, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { TransactionList as TxList } from '../themed/TransactionList.js'
import { Top } from '../themed/TransactionListComponents.js'

export const TransactionList = () => {
  const [searching, setSearching] = useState(false)
  const [searchString, setSearchString] = useState()

  const { transactions } = useSelector(state => state.ui.scenes.transactionList)
  const handleChangeSortingState = useCallback(isSearching => setSearching(isSearching), [])

  const { selectedWalletId, selectedCurrencyCode } = useSelector(state => state.ui.wallets)
  return (
    <SceneWrapper>
      <Top
        walletId={selectedWalletId}
        isEmpty={transactions.length < 1}
        searching={searching}
        onChangeSortingState={handleChangeSortingState}
        onSearchTransaction={setSearchString}
      />
      <TxList
        searching={searching}
        searchString={searchString}
        walletId={selectedWalletId}
        currencyCode={selectedCurrencyCode}
        initTransactions={transactions}
      />
    </SceneWrapper>
  )
}
