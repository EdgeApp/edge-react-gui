import { abs, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { convertNativeToDisplay, truncateDecimals } from '../../util/utils'
import { Tile } from '../tiles/Tile'

interface Props {
  transaction: EdgeTransaction
  wallet: EdgeCurrencyWallet
}

/**
 * Renders the crypto amount for a transaction object.
 * Used on the transaction details scene.
 */
export function TransactionCryptoAmountTile(props: Props) {
  const { transaction, wallet } = props
  const { currencyInfo } = wallet
  const { currencyCode, nativeAmount, networkFee, swapData } = transaction

  // Find the currency display name:
  const { allTokens } = wallet.currencyConfig
  let currencyName = currencyCode
  if (currencyCode === currencyInfo.currencyCode) currencyName = currencyInfo.displayName
  const tokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === transaction.currencyCode)
  if (tokenId != null) currencyName = allTokens[tokenId].displayName

  // Find the denomination to use:
  const walletDefaultDenom: EdgeDenomination = useSelector(state =>
    currencyInfo.currencyCode === currencyCode
      ? getExchangeDenomination(state, currencyInfo.pluginId, currencyCode)
      : getDisplayDenomination(state, currencyInfo.pluginId, currencyCode)
  )

  // Crypto Amount Logic
  const text = React.useMemo<string>(() => {
    const absoluteAmount = abs(nativeAmount)
    const direction = parseInt(nativeAmount) >= 0 ? 'receive' : 'send'

    if (direction === 'receive') {
      const convertedAmount = convertNativeToDisplay(walletDefaultDenom.multiplier)(absoluteAmount)
      const symbolString =
        currencyInfo.currencyCode === currencyCode && walletDefaultDenom.symbol ? walletDefaultDenom.symbol : swapData?.payoutCurrencyCode ?? ''

      return `${symbolString} ${convertedAmount}`
    }

    // It's a send, so the symbol is weirdly different for some reason:
    const symbolString = currencyInfo.currencyCode === currencyCode && walletDefaultDenom.symbol ? walletDefaultDenom.symbol : currencyCode

    if (networkFee !== '') {
      const amountMinusFee = sub(absoluteAmount, networkFee)
      const convertedAmount = convertNativeToDisplay(walletDefaultDenom.multiplier)(amountMinusFee)

      const convertedFee = abs(truncateDecimals(convertNativeToDisplay(walletDefaultDenom.multiplier)(networkFee)))
      const feeString = symbolString
        ? sprintf(lstrings.fragment_tx_detail_mining_fee_with_symbol, convertedFee)
        : sprintf(lstrings.fragment_tx_detail_mining_fee_with_denom, convertedFee, walletDefaultDenom.name)

      return `${symbolString} ${convertedAmount} (${feeString})`
    }

    // If the fee is missing, why not use the "receive" logic above?
    // I have no idea:
    return `${symbolString} ${absoluteAmount}`
  }, [currencyCode, currencyInfo, nativeAmount, networkFee, swapData, walletDefaultDenom])

  return <Tile type="static" title={sprintf(lstrings.transaction_details_crypto_amount, currencyName)} body={text} />
}
