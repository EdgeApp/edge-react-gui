import { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'

import { showError } from '../components/services/AirshipInstance'
import { useHandler } from './useHandler'

interface Output {
  atEnd: boolean
  transactions: EdgeTransaction[]
  requestMore: () => void
}

/**
 * Streams transactions from a wallet.
 *
 * Changing the wallet, tokenId, or search term will reset
 * the transaction list and start the stream from the beginning.
 * The list will not go all the way to the end at first,
 * so call the `requestMore` method to request more transactions,
 * until `atEnd` becomes true.
 */
export function useTransactionList(wallet: EdgeCurrencyWallet, tokenId: string | undefined, searchString?: string): Output {
  const { currencyCode } = tokenId == null ? wallet.currencyInfo : wallet.currencyConfig.allTokens[tokenId]

  const requestMore = React.useRef(() => {})

  // The effect maintains internal mutable state,
  // and then calls `setOutput` to expose it atomically.
  const [output, setOutput] = React.useState<Omit<Output, 'requestMore'>>({
    atEnd: false,
    transactions: []
  })

  // This effect runs when the wallet or search term change.
  // It resets the stream to the beginning each time it runs,
  // so we don't want it to self-trigger.
  React.useEffect(() => {
    // Reset our mutable state to an empty list:
    let atEnd = false
    const changedTxs = new Map<string, EdgeTransaction>()
    const txs: EdgeTransaction[] = []

    // Sends the mutable state to React,
    // merging the two transaction lists together:
    function requestRender() {
      const mergedTxs = txs.filter(tx => !changedTxs.has(tx.txid))
      mergedTxs.push(...changedTxs.values())
      mergedTxs.sort((a, b) => b.date - a.date)

      setOutput({
        atEnd,
        transactions: mergedTxs
      })
    }
    requestRender()

    // If the transaction list changes, we should restart the stream,
    // but don't delete the transactions we have so far.
    // Instead, just start re-writing the mutable array until
    // we get to the end.
    const cleanupNew = wallet.on('newTransactions', txs => {
      let relevant = false
      for (const tx of txs) {
        if (tx.currencyCode === currencyCode) {
          relevant = true
        }
      }
      if (relevant) restartStream()
    })

    // Don't restart the stream if a transaction changes,
    // but just overlay the new transactions over the old ones:
    const cleanupChanged = wallet.on('transactionsChanged', txs => {
      let relevant = false
      for (const tx of txs) {
        if (tx.currencyCode === currencyCode) {
          relevant = true
          changedTxs.set(tx.txid, tx)
        }
      }
      if (relevant) requestRender()
    })

    // Constructs a new stream, then updates `cleanupStream` and `requestMore`:
    let cleanupStream = () => {}
    function restartStream() {
      // If this gets set to `true`, the current stream is closed,
      // so we shouldn't do any more state updates,
      // even if a lingering promise resolves:
      let closed = false

      // Keep track of how many transactions we have read,
      // so we can insert them at the right place:
      let offset = 0

      // We have a pending promise if this is true, so don't call `next`:
      let busy = false

      const stream = wallet.streamTransactions({
        batchSize: 30,
        firstBatchSize: 10,
        searchString,
        tokenId
      })

      cleanupStream()
      cleanupStream = () => {
        closed = true
        if (stream.return != null) stream.return().catch(err => showError(err))
      }

      requestMore.current = () => {
        if (busy) return
        busy = true
        stream.next().then(
          result => {
            busy = false
            if (closed) return
            if (result.done) {
              atEnd = true
              txs.splice(offset, Infinity) // Trim stragglers
              requestRender()
            } else {
              const { value } = result
              txs.splice(offset, value.length, ...value)
              offset += value.length
              requestRender()
              if (offset < txs.length) requestMore.current()
            }
          },
          error => {
            busy = false
            showError(error)
          }
        )
      }

      // Do the first loop:
      requestMore.current()
    }

    // Start the first stream:
    restartStream()

    return () => {
      cleanupNew()
      cleanupChanged()
      cleanupStream()
    }
  }, [currencyCode, searchString, tokenId, wallet])

  return {
    ...output,
    requestMore: useHandler(() => requestMore.current())
  }
}
