// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Actions } from 'react-native-router-flux'

import { TRANSACTION_DETAILS } from '../../constants/SceneKeys.js'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings'
import { connect } from '../../types/reactRedux.js'
import type { TransactionListTx } from '../../types/types.js'
import * as UTILS from '../../util/utils'
import {
  DIVIDE_PRECISION,
  getDenomFromIsoCode,
  getDenomination,
  getFiatSymbol,
  maxPrimaryCurrencyConversionDecimals,
  precisionAdjust
} from '../../util/utils.js'
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
    const guiWallet = state.ui.wallets.byId[walletId]
    const { fiatCurrencyCode } = guiWallet
    const { settings } = state.ui
    const displayDenomination = getDenomination(currencyCode, settings, 'display')
    const exchangeDenomination = getDenomination(currencyCode, settings, 'exchange')
    const fiatDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)

    // Required Confirmations
    const { currencyWallets } = state.core.account
    const coreWallet: EdgeCurrencyWallet = currencyWallets[walletId]
    const currencyInfo: EdgeCurrencyInfo = coreWallet.currencyInfo
    const requiredConfirmations = currencyInfo.requiredConfirmations || 1 // set default requiredConfirmations to 1, so once the transaction is in a block consider fully confirmed

    // Thumbnail
    let thumbnailPath
    const contacts = state.contacts || []
    const transactionContactName = metadata && metadata.name ? UTILS.unspacedLowercase(metadata.name) : null
    for (const contact of contacts) {
      const { givenName, familyName } = contact
      const fullName = UTILS.unspacedLowercase(givenName + (familyName || ''))
      if (contact.thumbnailPath && fullName === transactionContactName) {
        thumbnailPath = contact.thumbnailPath
        break
      }
    }

    // CryptoAmount
    const rateKey = `${currencyCode}_${guiWallet.isoFiatCurrencyCode}`
    const exchangeRate = state.exchangeRates[rateKey] ? state.exchangeRates[rateKey] : undefined
    let maxConversionDecimals = 6
    if (exchangeRate) {
      const precisionAdjustValue = precisionAdjust({
        primaryExchangeMultiplier: exchangeDenomination.multiplier,
        secondaryExchangeMultiplier: fiatDenomination.multiplier,
        exchangeSecondaryToPrimaryRatio: exchangeRate
      })
      maxConversionDecimals = maxPrimaryCurrencyConversionDecimals(bns.log10(displayDenomination.multiplier), precisionAdjustValue)
    }
    const cryptoAmount = bns.div(bns.abs(transaction.nativeAmount || '0'), displayDenomination.multiplier, DIVIDE_PRECISION)
    const cryptoAmountFormat = intl.formatNumber(UTILS.decimalOrZero(UTILS.truncateDecimals(cryptoAmount, maxConversionDecimals), maxConversionDecimals))

    // FiatAmount
    const fiatAmount = metadata && metadata.amountFiat ? bns.abs(metadata.amountFiat.toFixed(2)) : '0.00'
    const fiatAmountFormat = intl.formatNumber(bns.toFixed(fiatAmount, 2, 2), { toFixed: 2 })

    return {
      isSentTransaction: UTILS.isSentTransaction(transaction),
      cryptoAmount: cryptoAmountFormat,
      fiatAmount: fiatAmountFormat,
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
