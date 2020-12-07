// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyInfo, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../assets/vector/index.js'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings'
import { type RootState } from '../../types/reduxTypes.js'
import type { TransactionListTx } from '../../types/types.js'
import * as UTILS from '../../util/utils'
import { getDenomination, getFiatSymbol } from '../../util/utils.js'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

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

type Props = OwnProps & StateProps & ThemeProps

export class TransactionListRowComponent extends React.PureComponent<Props> {
  handlePress = () => {
    const { transaction, thumbnailPath } = this.props
    if (transaction) {
      Actions.transactionDetails({ edgeTransaction: transaction, thumbnailPath })
    } else {
      showError(s.strings.transaction_details_error_invalid)
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
      requiredConfirmations,
      selectedCurrencyName,
      theme,
      thumbnailPath,
      transaction,
      walletBlockHeight
    } = this.props
    const styles = getStyles(theme)

    const cryptoAmountString = `${isSentTransaction ? '-' : '+'} ${denominationSymbol ? denominationSymbol + ' ' : ''}${cryptoAmount}`
    const fiatAmountString = `${fiatSymbol} ${fiatAmount}`

    // Transaction Text and Icon
    let transactionText, transactionIcon, transactionStyle
    if (isSentTransaction) {
      transactionText =
        transaction.metadata && transaction.metadata.name ? transaction.metadata.name : s.strings.fragment_transaction_list_sent_prefix + selectedCurrencyName
      transactionIcon = <Fontello name="send" size={theme.rem(1.75)} color={theme.negativeText} />
      transactionStyle = styles.iconSent
    } else {
      transactionText =
        transaction.metadata && transaction.metadata.name
          ? transaction.metadata.name
          : s.strings.fragment_transaction_list_receive_prefix + selectedCurrencyName
      transactionIcon = <Fontello name="request" size={theme.rem(1.75)} color={theme.positiveText} />
      transactionStyle = styles.iconRequest
    }

    // Pending Text and Style
    const currentConfirmations = walletBlockHeight && transaction.blockHeight > 0 ? walletBlockHeight - transaction.blockHeight + 1 : 0
    let pendingText, pendingStyle
    if (walletBlockHeight === 0) {
      pendingText = s.strings.fragment_transaction_list_tx_synchronizing
      pendingStyle = styles.partialTime
    } else if (transaction.blockHeight < 0) {
      pendingText = s.strings.fragment_transaction_list_tx_dropped
      pendingStyle = styles.partialTime
    } else if (currentConfirmations <= 0) {
      // if completely unconfirmed or wallet uninitialized, or wallet lagging behind (transaction block height larger than wallet block height)
      pendingText = s.strings.fragment_wallet_unconfirmed
      pendingStyle = styles.pendingTime
    } else if (currentConfirmations < requiredConfirmations) {
      pendingText = sprintf(s.strings.fragment_transaction_list_confirmation_progress, currentConfirmations, requiredConfirmations)
      pendingStyle = styles.partialTime
    } else {
      pendingText = transaction.time
      pendingStyle = styles.completedTime
    }

    // Transaction Category
    let categoryText
    const transactionCategory = transaction.metadata ? transaction.metadata.category : null
    if (transactionCategory) {
      const splittedFullCategory = UTILS.splitTransactionCategory(transactionCategory)
      const { category, subCategory } = splittedFullCategory
      if (subCategory) {
        const mainCategory = category.toLowerCase()
        switch (mainCategory) {
          case 'exchange':
            categoryText = `${s.strings.fragment_transaction_exchange}:${subCategory}`
            break
          case 'expense':
            categoryText = `${s.strings.fragment_transaction_expense}:${subCategory}`
            break
          case 'transfer':
            categoryText = `${s.strings.fragment_transaction_transfer}:${subCategory}`
            break
          case 'income':
            categoryText = `${s.strings.fragment_transaction_income}:${subCategory}`
            break
          default:
            break
        }
      }
    }

    return (
      <TouchableOpacity onPress={this.handlePress}>
        <View style={styles.rowContainer}>
          <View style={[styles.iconContainer, transactionStyle]}>
            {thumbnailPath ? <Image style={styles.icon} source={{ uri: thumbnailPath }} /> : transactionIcon}
          </View>
          <View style={styles.transactionContainer}>
            <View style={styles.transactionRow}>
              <EdgeText style={styles.transactionText}>{transactionText}</EdgeText>
              <EdgeText style={isSentTransaction ? styles.negativeCryptoAmount : styles.positiveCryptoAmount}>{cryptoAmountString}</EdgeText>
            </View>
            <View style={styles.transactionRow}>
              <View style={styles.categoryAndTimeContainer}>
                {categoryText && <EdgeText style={styles.category}>{categoryText}</EdgeText>}
                <EdgeText style={pendingStyle}>{pendingText}</EdgeText>
              </View>
              <EdgeText style={styles.fiatAmount}>{fiatAmountString}</EdgeText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: theme.rem(1.5),
    paddingHorizontal: theme.rem(1.5)
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.transactionListIconBackground,
    paddingHorizontal: theme.rem(0.5),
    width: theme.rem(3.25),
    height: theme.rem(3.25),
    borderWidth: theme.mediumLineWidth,
    borderRadius: theme.rem(1)
  },
  iconSent: {
    borderColor: theme.negativeText,
    shadowColor: theme.negativeText,
    shadowOffset: {
      width: 0,
      height: theme.rem(3)
    },
    shadowOpacity: 0.5,
    shadowRadius: theme.rem(10),
    elevation: theme.rem(3)
  },
  iconRequest: {
    borderColor: theme.positiveText,
    shadowColor: theme.positiveText,
    shadowOffset: {
      width: 0,
      height: theme.rem(3)
    },
    shadowOpacity: 0.5,
    shadowRadius: theme.rem(10),
    elevation: theme.rem(3)
  },
  icon: {
    width: theme.rem(3),
    height: theme.rem(3),
    borderRadius: theme.rem(0.875)
  },
  transactionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.rem(0.5)
  },
  transactionRow: {
    flexDirection: 'row',
    marginVertical: theme.rem(0.125)
  },
  transactionText: {
    flex: 1,
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(0.75)
  },
  positiveCryptoAmount: {
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold,
    color: theme.positiveText,
    textAlign: 'right'
  },
  negativeCryptoAmount: {
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold,
    color: theme.negativeText,
    textAlign: 'right'
  },
  fiatAmount: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    textAlign: 'right'
  },
  categoryAndTimeContainer: {
    flex: 1
  },
  category: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  partialTime: {
    fontSize: theme.rem(0.75),
    color: theme.warningText
  },
  pendingTime: {
    fontSize: theme.rem(0.75),
    color: theme.dangerText
  },
  completedTime: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const TransactionListRow = connect((state: RootState, ownProps: OwnProps): StateProps => {
  const { currencyCode, walletId, transaction } = ownProps
  const { metadata } = transaction
  const guiWallet = state.ui.wallets.byId[walletId]
  const { fiatCurrencyCode } = guiWallet
  const displayDenomination = getDenomination(currencyCode, state.ui.settings)

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
})(withTheme(TransactionListRowComponent))
