// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import * as intl from '../../locales/intl.js'
import s from '../../locales/strings'
import { type RootState } from '../../types/reduxTypes.js'
import type { TransactionListTx } from '../../types/types.js'
import * as UTILS from '../../util/utils'
import { getDisplayDenomination, getFiatSymbol } from '../../util/utils.js'
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
  walletId: string,
  currencyCode: string,
  transaction: TransactionListTx
}

type Props = OwnProps & StateProps

export class TransactionListRowComponent extends React.PureComponent<Props> {
  onPress = () => {
    const { transaction, thumbnailPath } = this.props
    if (transaction) {
      Actions.transactionDetails({ edgeTransaction: transaction, thumbnailPath })
    } else {
      showError(s.strings.transaction_details_error_invalid)
    }
  }

  render() {
    return (
      <TransactionRow
        cryptoAmount={this.props.cryptoAmount}
        denominationSymbol={this.props.denominationSymbol}
        fiatAmount={this.props.fiatAmount}
        fiatSymbol={this.props.fiatSymbol}
        onPress={this.onPress}
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

export const TransactionListRow = connect((state: RootState, ownProps: OwnProps): StateProps => {
  const { currencyCode, walletId, transaction } = ownProps
  const { metadata } = transaction
  const guiWallet = state.ui.wallets.byId[walletId]
  const { fiatCurrencyCode } = guiWallet
  const displayDenomination = getDisplayDenomination(currencyCode, state.ui.settings)

  // Required Confirmations
  const { currencyWallets = {} } = state.core.account
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
  const cryptoAmount = UTILS.convertNativeToDisplay(displayDenomination.multiplier)(bns.abs(transaction.nativeAmount || ''))
  const cryptoAmountFormat = intl.formatNumber(UTILS.decimalOrZero(UTILS.truncateDecimals(cryptoAmount, 6), 6))

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
})(TransactionListRowComponent)
