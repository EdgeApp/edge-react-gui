// @flow

import { abs, div, log10 } from 'biggystring'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { TRANSACTION_DETAILS } from '../../constants/SceneKeys.js'
import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import type { TransactionListTx } from '../../types/types.js'
import {
  DECIMAL_PRECISION,
  decimalOrZero,
  DEFAULT_TRUNCATE_PRECISION,
  displayFiatAmount,
  getDenomFromIsoCode,
  getFiatSymbol,
  isSentTransaction,
  maxPrimaryCurrencyConversionDecimals,
  precisionAdjust,
  truncateDecimals,
  unspacedLowercase
} from '../../util/utils'
import { showError } from '../services/AirshipInstance.js'
import { TransactionRow } from './TransactionRow.js'

type StateProps = {
  cryptoAmount: string,
  denominationSymbol?: string,
  fiatAmount: string,
  fiatSymbol: string,
  isSentTransaction: boolean,
  requiredConfirmations: number,
  selectedCurrencyName: string,
  thumbnailPath?: string,
  walletBlockHeight: number
}

type OwnProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  walletId: string,
  // eslint-disable-next-line react/no-unused-prop-types
  currencyCode: string,
  transaction: TransactionListTx
}

type Props = OwnProps & StateProps

export class TransactionListRowComponent extends React.PureComponent<Props> {
  handlePress = () => {
    const { transaction, thumbnailPath } = this.props
    if (transaction == null) {
      return showError(s.strings.transaction_details_error_invalid)
    }
    Actions.push(TRANSACTION_DETAILS, {
      edgeTransaction: transaction,
      thumbnailPath
    })
  }

  render() {
    return (
      <TransactionRow
        cryptoAmount={this.props.cryptoAmount}
        denominationSymbol={this.props.denominationSymbol}
        fiatAmount={this.props.fiatAmount}
        fiatSymbol={this.props.fiatSymbol}
        onPress={this.handlePress}
        isSentTransaction={this.props.isSentTransaction}
        requiredConfirmations={this.props.requiredConfirmations}
        selectedCurrencyName={this.props.selectedCurrencyName}
        thumbnailPath={this.props.thumbnailPath}
        transaction={this.props.transaction}
        walletBlockHeight={this.props.walletBlockHeight}
      />
    )
  }
}

export const TransactionListRow = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { currencyCode, walletId, transaction } = ownProps
    const { metadata } = transaction
    const { name, amountFiat } = metadata ?? {}
    const guiWallet = state.ui.wallets.byId[walletId]
    const { fiatCurrencyCode } = guiWallet
    const { currencyWallets } = state.core.account
    const coreWallet: EdgeCurrencyWallet = currencyWallets[walletId]
    const currencyInfo: EdgeCurrencyInfo = coreWallet.currencyInfo
    const displayDenomination = getDisplayDenomination(state, currencyInfo.pluginId, currencyCode)
    const exchangeDenomination = getExchangeDenomination(state, currencyInfo.pluginId, currencyCode)
    const fiatDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)

    // Required Confirmations
    const requiredConfirmations = currencyInfo.requiredConfirmations || 1 // set default requiredConfirmations to 1, so once the transaction is in a block consider fully confirmed

    // Thumbnail
    let thumbnailPath
    const contacts = state.contacts || []
    const transactionContactName = name != null ? unspacedLowercase(name) : null
    for (const contact of contacts) {
      const { givenName, familyName } = contact
      const fullName = unspacedLowercase(givenName + (familyName ?? ''))
      if (contact.thumbnailPath && fullName === transactionContactName) {
        thumbnailPath = contact.thumbnailPath
        break
      }
    }

    // CryptoAmount
    const rateKey = `${currencyCode}_${guiWallet.isoFiatCurrencyCode}`
    const exchangeRate = state.exchangeRates[rateKey] ? state.exchangeRates[rateKey] : undefined
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

    return {
      isSentTransaction: isSentTransaction(transaction),
      cryptoAmount: cryptoAmountFormat,
      fiatAmount: displayFiatAmount(amountFiat),
      fiatSymbol: getFiatSymbol(fiatCurrencyCode),
      walletBlockHeight: guiWallet.blockHeight || 0,
      denominationSymbol: displayDenomination.symbol,
      requiredConfirmations,
      selectedCurrencyName: guiWallet.currencyNames[currencyCode] || currencyCode,
      thumbnailPath
    }
  },
  dispatch => ({})
)(TransactionListRowComponent)
