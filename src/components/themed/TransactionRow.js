// @flow

import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings'
import type { TransactionListTx } from '../../types/types.js'
import { splitTransactionCategory } from '../../util/utils'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ClickableRow } from './ClickableRow'
import { EdgeText } from './EdgeText.js'

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
  transaction: TransactionListTx
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
      transaction
    } = this.props
    const styles = getStyles(theme)

    const cryptoAmountString = `${isSentTransaction ? '-' : '+'} ${denominationSymbol ? denominationSymbol + ' ' : ''}${cryptoAmount}`
    const fiatAmountString = `${fiatSymbol} ${fiatAmount}`

    // Transaction Text and Icon
    let transactionText, transactionIcon, transactionStyle
    if (isSentTransaction) {
      transactionText =
        transaction.metadata && transaction.metadata.name ? transaction.metadata.name : s.strings.fragment_transaction_list_sent_prefix + selectedCurrencyName
      transactionIcon = <Ionicons name="arrow-up" size={theme.rem(1.25)} color={theme.negativeText} style={styles.iconArrows} />
      transactionStyle = styles.iconSent
    } else {
      transactionText =
        transaction.metadata && transaction.metadata.name
          ? transaction.metadata.name
          : s.strings.fragment_transaction_list_receive_prefix + selectedCurrencyName
      transactionIcon = <Ionicons name="arrow-down" size={theme.rem(1.25)} color={theme.positiveText} style={styles.iconArrows} />
      transactionStyle = styles.iconRequest
    }

    // Pending Text and Style
    const currentConfirmations = transaction.confirmations
    const pendingText =
      currentConfirmations === 'confirmed'
        ? transaction.time
        : currentConfirmations === 'unconfirmed'
        ? s.strings.fragment_wallet_unconfirmed
        : currentConfirmations === 'dropped'
        ? s.strings.fragment_transaction_list_tx_dropped
        : currentConfirmations == null
        ? s.strings.fragment_transaction_list_tx_synchronizing
        : sprintf(s.strings.fragment_transaction_list_confirmation_progress, currentConfirmations, requiredConfirmations)
    const pendingStyle = currentConfirmations === 'confirmed' ? styles.completedTime : styles.partialTime

    // Transaction Category
    let categoryText
    const transactionCategory = transaction.metadata ? transaction.metadata.category : null
    if (transactionCategory) {
      const splittedFullCategory = splitTransactionCategory(transactionCategory)
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
      <ClickableRow paddingRem={[0, 1]} onPress={onPress}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconArrowsContainer, transactionStyle, thumbnailPath ? null : styles.iconArrowsContainerBackground]}>
            {thumbnailPath ? null : transactionIcon}
          </View>
          <FastImage style={styles.icon} source={{ uri: thumbnailPath }} />
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
      </ClickableRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  iconContainer: {
    marginRight: theme.rem(1)
  },
  iconArrowsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.rem(2),
    height: theme.rem(2),
    borderWidth: theme.mediumLineWidth,
    borderRadius: theme.rem(0.75),
    zIndex: 1
  },
  iconArrowsContainerBackground: {
    backgroundColor: theme.transactionListIconBackground
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
    position: 'absolute',
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(0.75)
  },
  // Some of the react-native-vector-icon icons does have surrounding white space and leans towards the left.
  // Tested some other icons also like the AntDesign and MaterialIcons and have similar problems.
  // Needed to be replaced by a custom icon to remove hack.
  iconArrows: {
    marginLeft: 1
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
    fontFamily: theme.fontFaceMedium
  },
  positiveCryptoAmount: {
    marginLeft: theme.rem(0.5),
    fontFamily: theme.fontFaceMedium,
    color: theme.positiveText,
    textAlign: 'right'
  },
  negativeCryptoAmount: {
    marginLeft: theme.rem(0.5),
    fontFamily: theme.fontFaceMedium,
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
