// @flow

import * as React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings'
import type { TransactionListTx } from '../../types/types.js'
import * as UTILS from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type OwnProps = {
  cryptoAmount: string,
  denominationSymbol?: string,
  fiatAmount: string,
  fiatSymbol: string,
  onPress: () => void,
  isSentTransaction: boolean,
  requiredConfirmations: number,
  selectedCurrencyName: string,
  thumbnailPath?: string,
  transaction: TransactionListTx,
  walletBlockHeight: number
}

type Props = OwnProps & ThemeProps

class TransactionRowComponent extends React.PureComponent<Props> {
  render() {
    // What is this for?
    global.pcount && global.pcount('TransactionRow:render')

    const {
      cryptoAmount,
      denominationSymbol,
      fiatAmount,
      fiatSymbol,
      isSentTransaction,
      onPress,
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
      transactionIcon = <Ionicons name="arrow-up" size={theme.rem(1.25)} color={theme.negativeText} />
      transactionStyle = styles.iconSent
    } else {
      transactionText =
        transaction.metadata && transaction.metadata.name
          ? transaction.metadata.name
          : s.strings.fragment_transaction_list_receive_prefix + selectedCurrencyName
      transactionIcon = <Ionicons name="arrow-down" size={theme.rem(1.25)} color={theme.positiveText} />
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
      <TouchableOpacity onPress={onPress}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: theme.rem(4.25),
    marginHorizontal: theme.rem(1)
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.transactionListIconBackground,
    width: theme.rem(2),
    height: theme.rem(2),
    marginRight: theme.rem(1),
    borderWidth: theme.mediumLineWidth,
    borderRadius: theme.rem(0.75)
  },
  iconSent: {
    borderColor: theme.negativeText,
    shadowColor: theme.negativeText,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.3,
    shadowRadius: theme.rem(0.5),
    elevation: 3
  },
  iconRequest: {
    borderColor: theme.positiveText,
    shadowColor: theme.positiveText,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.3,
    shadowRadius: theme.rem(0.5),
    elevation: 3
  },
  icon: {
    width: theme.rem(1.75),
    height: theme.rem(1.75),
    borderRadius: theme.rem(0.5)
  },
  transactionContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  transactionRow: {
    flexDirection: 'row'
  },
  transactionText: {
    flex: 1,
    fontFamily: theme.fontFaceBold
  },
  positiveCryptoAmount: {
    fontFamily: theme.fontFaceBold,
    color: theme.positiveText,
    textAlign: 'right'
  },
  negativeCryptoAmount: {
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

export const TransactionRow = withTheme(TransactionRowComponent)
