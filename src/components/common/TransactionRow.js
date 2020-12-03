// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Alert, Image, StyleSheet, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import receivedTypeImage from '../../assets/images/transactions/transaction-type-received.png'
import sentTypeImage from '../../assets/images/transactions/transaction-type-sent.png'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { TransactionListTx } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils'
import { getDenomination, getFiatSymbol } from '../../util/utils.js'

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
  isHeader: boolean,
  currencyId: string,
  currencyCode: string,
  transaction: TransactionListTx
}

type Props = OwnProps & StateProps

export class TransactionRowComponent extends React.PureComponent<Props> {
  goToTxDetail = () => {
    const { transaction, thumbnailPath } = this.props
    if (transaction) {
      Actions.transactionDetails({ transaction, thumbnailPath })
    } else {
      Alert.alert(s.strings.transaction_details_error_invalid)
    }
  }

  render() {
    // What is this for?
    global.pcount && global.pcount('TransactionRow:render')

    const {
      cryptoAmount,
      denominationSymbol,
      fiatAmount,
      fiatSymbol,
      isSentTransaction,
      isHeader,
      requiredConfirmations,
      selectedCurrencyName,
      thumbnailPath,
      transaction,
      walletBlockHeight
    } = this.props

    const cryptoAmountString = `${isSentTransaction ? '-' : '+'} ${denominationSymbol ? denominationSymbol + ' ' : ''}${cryptoAmount}`
    const fiatAmountString = `${fiatSymbol} ${fiatAmount}`

    // Transaction Text and Icon
    let transactionText, transactionIcon
    if (isSentTransaction) {
      transactionText =
        transaction.metadata && transaction.metadata.name ? transaction.metadata.name : s.strings.fragment_transaction_list_sent_prefix + selectedCurrencyName
      transactionIcon = sentTypeImage
    } else {
      transactionText =
        transaction.metadata && transaction.metadata.name
          ? transaction.metadata.name
          : s.strings.fragment_transaction_list_receive_prefix + selectedCurrencyName
      transactionIcon = receivedTypeImage
    }

    // Pending Text and Style
    const currentConfirmations = walletBlockHeight && transaction.blockHeight > 0 ? walletBlockHeight - transaction.blockHeight + 1 : 0
    let pendingText, pendingStyle
    if (walletBlockHeight === 0) {
      pendingText = s.strings.fragment_transaction_list_tx_synchronizing
      pendingStyle = styles.transactionPartialConfirmation
    } else if (transaction.blockHeight < 0) {
      pendingText = s.strings.fragment_transaction_list_tx_dropped
      pendingStyle = styles.transactionPartialConfirmation
    } else if (currentConfirmations <= 0) {
      // if completely unconfirmed or wallet uninitialized, or wallet lagging behind (transaction block height larger than wallet block height)
      pendingText = s.strings.fragment_wallet_unconfirmed
      pendingStyle = styles.transactionPending
    } else if (currentConfirmations < requiredConfirmations) {
      pendingStyle = styles.transactionPartialConfirmation
      pendingText = sprintf(s.strings.fragment_transaction_list_confirmation_progress, currentConfirmations, requiredConfirmations)
    } else {
      pendingText = transaction.time
      pendingStyle = styles.transactionTime
    }

    // Transaction Category
    let formattedTransactionCategory
    const transactionCategory = transaction.metadata ? transaction.metadata.category : null
    if (transactionCategory) {
      const splittedFullCategory = UTILS.splitTransactionCategory(transactionCategory)
      const { category, subCategory } = splittedFullCategory
      if (subCategory) {
        const mainCategory = category.toLowerCase()
        switch (mainCategory) {
          case 'exchange':
            formattedTransactionCategory = `${s.strings.fragment_transaction_exchange}:${subCategory}`
            break
          case 'expense':
            formattedTransactionCategory = `${s.strings.fragment_transaction_expense}:${subCategory}`
            break
          case 'transfer':
            formattedTransactionCategory = `${s.strings.fragment_transaction_transfer}:${subCategory}`
            break
          case 'income':
            formattedTransactionCategory = `${s.strings.fragment_transaction_income}:${subCategory}`
            break
          default:
            break
        }
      }
    }

    return (
      <View style={styles.singleTransactionWrap}>
        {isHeader && (
          <View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <T style={styles.formattedDate}>{transaction.dateString}</T>
            </View>
          </View>
        )}
        <TouchableHighlight onPress={this.goToTxDetail} underlayColor={THEME.COLORS.ROW_PRESSED} style={styles.singleTransaction}>
          <View style={styles.transactionInfoWrap}>
            <View style={styles.transactionLeft}>
              <View style={styles.transactionLeftLogoWrap}>
                {thumbnailPath ? (
                  <Image style={styles.transactionLogo} source={{ uri: thumbnailPath }} />
                ) : (
                  <Image style={styles.transactionLogo} source={transactionIcon} />
                )}
              </View>
            </View>

            <View style={styles.transactionRight}>
              <View style={[styles.transactionDetailsRow, transactionCategory ? styles.transactionDetailsRowMargin : null]}>
                <T style={styles.transactionPartner} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {transactionText}
                </T>
                <T style={isSentTransaction ? styles.transactionDetailsSentTx : styles.transactionDetailsReceivedTx}>{cryptoAmountString}</T>
              </View>
              {formattedTransactionCategory ? (
                <View style={styles.transactionDetailsRow}>
                  <T style={styles.transactionCategory}>{formattedTransactionCategory}</T>
                  <T style={styles.transactionFiat}>{fiatAmountString}</T>
                </View>
              ) : null}
              {formattedTransactionCategory ? (
                <View style={[styles.transactionDetailsRow, styles.transactionDetailsRowMargin]}>
                  <T style={[styles.transactionPendingTime, pendingStyle]}>{pendingText}</T>
                </View>
              ) : null}
              {!formattedTransactionCategory ? (
                <View style={styles.transactionDetailsRow}>
                  <T style={[styles.transactionPendingTime, pendingStyle]}>{pendingText}</T>
                  <T style={styles.transactionFiat}>{fiatAmountString}</T>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}

const rawStyles = {
  singleTransaction: {
    height: scale(80),
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    padding: scale(15),
    paddingRight: scale(15),
    paddingLeft: scale(15)
  },
  singleTransactionWrap: {
    backgroundColor: THEME.COLORS.WHITE,
    flexDirection: 'column',
    flex: 1
  },
  singleDateArea: {
    backgroundColor: THEME.COLORS.GRAY_4,
    flex: 3,
    padding: scale(3),
    paddingLeft: scale(15),
    flexDirection: 'row',
    paddingRight: scale(24)
  },
  leftDateArea: {
    flex: 1
  },
  formattedDate: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(14)
  },
  transactionInfoWrap: {
    flex: 1,
    flexDirection: 'row',
    height: scale(40)
  },
  transactionLeft: {
    flexDirection: 'row'
  },
  transactionLogo: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(10)
  },
  transactionLeftLogoWrap: {
    justifyContent: 'center'
  },
  transactionPartner: {
    flex: 1
  },
  transactionRight: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  transactionTime: {
    color: THEME.COLORS.SECONDARY
  },
  transactionPending: {
    color: THEME.COLORS.ACCENT_RED
  },
  transactionPartialConfirmation: {
    color: THEME.COLORS.ACCENT_ORANGE
  },
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
  },
  transactionDetailsRow: {
    flexDirection: 'row',
    width: '100%'
  },
  transactionDetailsRowMargin: {
    marginBottom: scale(2)
  },
  transactionDetailsReceivedTx: {
    color: THEME.COLORS.TRANSACTION_LIST_RECEIVED_TX
  },
  transactionDetailsSentTx: {
    color: THEME.COLORS.TRANSACTION_LIST_SENT_TX
  },
  transactionCategory: {
    flex: 1,
    fontSize: 12,
    color: THEME.COLORS.SECONDARY
  },
  transactionFiat: {
    fontSize: 12,
    color: THEME.COLORS.SECONDARY
  },
  transactionPendingTime: {
    flex: 1,
    fontSize: 12
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const TransactionRow = connect((state: RootState, ownProps: OwnProps): StateProps => {
  const { currencyCode, currencyId, transaction } = ownProps
  const { metadata } = transaction
  const guiWallet = state.ui.wallets.byId[currencyId]
  const { fiatCurrencyCode } = guiWallet
  const displayDenomination = getDenomination(currencyCode, state.ui.settings)

  // Required Confirmations
  const { currencyWallets = {} } = state.core.account
  const coreWallet: EdgeCurrencyWallet = currencyWallets[currencyId]
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
})(TransactionRowComponent)
