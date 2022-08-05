// @flow

import { abs, div, log10 } from 'biggystring'
import * as React from 'react'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants.js'
import { displayFiatAmount } from '../../hooks/useFiatText.js'
import { useHandler } from '../../hooks/useHandler.js'
import { useWatch } from '../../hooks/useWatch.js'
import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { useSelector } from '../../types/reactRedux'
import { type GuiContact } from '../../types/types'
import type { TransactionListTx } from '../../types/types.js'
import {
  DECIMAL_PRECISION,
  decimalOrZero,
  DEFAULT_TRUNCATE_PRECISION,
  getDenomFromIsoCode,
  isSentTransaction,
  maxPrimaryCurrencyConversionDecimals,
  normalizeForSearch,
  precisionAdjust,
  truncateDecimals
} from '../../util/utils'
import { showError } from '../services/AirshipInstance.js'
import { TransactionRow } from './TransactionRow.js'

type Props = {
  walletId: string,
  currencyCode: string,
  transaction: TransactionListTx,
  navigation: NavigationProp<any>
}

export function TransactionListRow(props: Props) {
  const { currencyCode, walletId, transaction } = props
  const { metadata } = transaction
  const { name, amountFiat } = metadata ?? {}
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const wallet = currencyWallets[walletId]
  const fiatCurrencyCode = useWatch(wallet, 'fiatCurrencyCode')
  const nonIsoFiatCurrencyCode = fiatCurrencyCode.replace('iso:', '')
  const currencyInfo = wallet.currencyInfo

  const displayDenomination = useSelector(state => getDisplayDenomination(state, currencyInfo.pluginId, currencyCode))
  const exchangeDenomination = useSelector(state => getExchangeDenomination(state, currencyInfo.pluginId, currencyCode))
  const fiatDenomination = getDenomFromIsoCode(nonIsoFiatCurrencyCode)

  const currencyName =
    currencyCode === currencyInfo.currencyCode
      ? currencyInfo.displayName
      : currencyInfo.metaTokens.find(metaToken => metaToken.currencyCode === currencyCode)?.currencyName

  // Required Confirmations
  const requiredConfirmations = currencyInfo.requiredConfirmations || 1 // set default requiredConfirmations to 1, so once the transaction is in a block consider fully confirmed

  // Thumbnail
  let thumbnailPath
  const contacts: GuiContact[] = useSelector(state => state.contacts) ?? []
  const transactionContactName = name != null ? normalizeForSearch(name) : null
  for (const contact of contacts) {
    const { givenName, familyName } = contact
    const fullName = normalizeForSearch(`${givenName}${familyName ?? ''}`)
    if (contact.thumbnailPath && fullName === transactionContactName) {
      thumbnailPath = contact.thumbnailPath
      break
    }
  }

  // CryptoAmount
  const rateKey = `${currencyCode}_${fiatCurrencyCode}`
  const exchangeRate: string = useSelector(state => state.exchangeRates[rateKey])
  let maxConversionDecimals = DEFAULT_TRUNCATE_PRECISION
  if (exchangeRate) {
    const precisionAdjustValue = precisionAdjust({
      primaryExchangeMultiplier: exchangeDenomination.multiplier,
      secondaryExchangeMultiplier: fiatDenomination.multiplier,
      exchangeSecondaryToPrimaryRatio: exchangeRate
    })
    maxConversionDecimals = maxPrimaryCurrencyConversionDecimals(log10(displayDenomination.multiplier), precisionAdjustValue)
  }
  const cryptoAmount = div(abs(transaction.nativeAmount ?? '0'), displayDenomination.multiplier, DECIMAL_PRECISION)
  const cryptoAmountFormat = formatNumber(decimalOrZero(truncateDecimals(cryptoAmount, maxConversionDecimals), maxConversionDecimals))

  const handlePress = useHandler(() => {
    if (transaction == null) {
      return showError(s.strings.transaction_details_error_invalid)
    }
    navigation.push('transactionDetails', {
      edgeTransaction: transaction,
      thumbnailPath
    })
  })

  return (
    <TransactionRow
      cryptoAmount={cryptoAmountFormat}
      denominationSymbol={displayDenomination.symbol}
      fiatAmount={displayFiatAmount(amountFiat)}
      fiatSymbol={getSymbolFromCurrency(nonIsoFiatCurrencyCode)}
      onPress={handlePress}
      isSentTransaction={isSentTransaction(transaction)}
      requiredConfirmations={requiredConfirmations}
      selectedCurrencyName={currencyName || currencyCode}
      thumbnailPath={thumbnailPath}
      transaction={transaction}
    />
  )
}
