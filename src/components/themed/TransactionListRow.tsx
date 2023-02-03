import { abs, div, gt, log10 } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import Share from 'react-native-share'
import { sprintf } from 'sprintf-js'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { displayFiatAmount } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { useHistoricalRate } from '../../hooks/useHistoricalRate'
import { useWatch } from '../../hooks/useWatch'
import { formatNumber } from '../../locales/intl'
import s from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { GuiContact, TransactionListTx } from '../../types/types'
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
import { showError } from '../services/AirshipInstance'
import { TransactionRow } from './TransactionRow'

interface Props {
  navigation: NavigationBase
  wallet: EdgeCurrencyWallet
  currencyCode: string
  transaction: TransactionListTx
}

export function TransactionListRow(props: Props) {
  const { navigation, currencyCode, wallet, transaction } = props
  const { metadata } = transaction
  const { name, amountFiat: defaultAmountFiat = 0 } = metadata ?? {}

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
  let thumbnailPath: string | undefined
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
  if (exchangeRate != null && gt(exchangeRate, '0')) {
    const precisionAdjustValue = precisionAdjust({
      primaryExchangeMultiplier: exchangeDenomination.multiplier,
      secondaryExchangeMultiplier: fiatDenomination.multiplier,
      exchangeSecondaryToPrimaryRatio: exchangeRate
    })
    maxConversionDecimals = maxPrimaryCurrencyConversionDecimals(log10(displayDenomination.multiplier), precisionAdjustValue)
  }
  const cryptoAmount = div(abs(transaction.nativeAmount ?? '0'), displayDenomination.multiplier, DECIMAL_PRECISION)
  const cryptoExchangeAmount = div(abs(transaction.nativeAmount ?? '0'), exchangeDenomination.multiplier, DECIMAL_PRECISION)
  const cryptoAmountFormat = formatNumber(decimalOrZero(truncateDecimals(cryptoAmount, maxConversionDecimals), maxConversionDecimals))

  const isoDate = new Date(transaction.date * 1000).toISOString()
  const historicalRate = useHistoricalRate(`${currencyCode}_${fiatCurrencyCode}`, isoDate)
  const amountFiat = defaultAmountFiat > 0 ? defaultAmountFiat : historicalRate * Number(cryptoExchangeAmount)

  const handlePress = useHandler(() => {
    if (transaction == null) {
      return showError(s.strings.transaction_details_error_invalid)
    }
    navigation.push('transactionDetails', {
      edgeTransaction: transaction,
      walletId: wallet.id,
      thumbnailPath,
      amountFiat
    })
  })

  const handleLongPress = useHandler(() => {
    const url = sprintf(currencyInfo.transactionExplorer, transaction.txid)
    const shareOptions = {
      url
    }
    Share.open(shareOptions).catch(e => showError(e))
  })

  return (
    <TransactionRow
      cryptoAmount={cryptoAmountFormat}
      denominationSymbol={displayDenomination.symbol}
      fiatAmount={displayFiatAmount(amountFiat)}
      fiatSymbol={getSymbolFromCurrency(nonIsoFiatCurrencyCode)}
      onPress={handlePress}
      onLongPress={handleLongPress}
      isSentTransaction={isSentTransaction(transaction)}
      requiredConfirmations={requiredConfirmations}
      selectedCurrencyName={currencyName || currencyCode}
      thumbnailPath={thumbnailPath}
      transaction={transaction}
      wallet={wallet}
    />
  )
}
