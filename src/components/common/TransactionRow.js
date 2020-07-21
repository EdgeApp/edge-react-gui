// @flow

import { bns } from 'biggystring'
import type { EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { Image, StyleSheet, TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import receivedTypeImage from '../../assets/images/transactions/transaction-type-received.png'
import sentTypeImage from '../../assets/images/transactions/transaction-type-sent.png'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import type { ContactsState } from '../../reducers/ContactsReducer'
import { THEME } from '../../theme/variables/airbitz.js'
import type { GuiWallet, TransactionListTx } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import * as UTILS from '../../util/utils'

type TransactionRowOwnProps = {
  transactions: Array<TransactionListTx>,
  transaction: TransactionListTx,
  selectedCurrencyCode: string,
  contacts: ContactsState,
  uiWallet: GuiWallet,
  displayDenomination: EdgeDenomination,
  isoFiatCurrencyCode: string,
  fiatCurrencyCode: string,
  onClick: (edgeTransaction: EdgeTransaction, thumbnailPath: string) => void,
  fiatSymbol: string,
  requiredConfirmations: number
}

export type TransactionRowStateProps = {
  walletBlockHeight: number | null
}
type Props = TransactionRowOwnProps & TransactionRowStateProps

type State = {}

export class TransactionRowComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  shouldComponentUpdate(nextProps: Props) {
    const diffElement = UTILS.getObjectDiff(this.props, nextProps, { transaction: true }, { transactions: true })
    if (diffElement) {
      return true
    } else {
      return false
    }
  }

  render() {
    global.pcount && global.pcount('TransactionRow:render')
    const completedTxList: Array<TransactionListTx> = this.props.transactions
    // $FlowFixMe
    const tx = this.props.transaction.item

    // Work around corrupted metadata from another GUI bug:
    if (tx.metadata != null && tx.metadata.name != null && typeof tx.metadata.name !== 'string') {
      tx.metadata.name = ''
    }

    let lastOfDate, txImage, pendingTimeSyntax, transactionPartner, pendingTimeStyle
    let txName = ''
    let thumbnailPath = ''

    let currencyName = this.props.uiWallet.currencyNames[this.props.selectedCurrencyCode]
    if (!currencyName) {
      currencyName = this.props.selectedCurrencyCode
    }
    if (UTILS.isSentTransaction(tx)) {
      // XXX -paulvp Why is this hard coded here?
      txName = s.strings.fragment_transaction_list_sent_prefix + currencyName
      txImage = sentTypeImage
    } else {
      txName = s.strings.fragment_transaction_list_receive_prefix + currencyName
      txImage = receivedTypeImage
    }

    if (tx.metadata && tx.metadata.name) {
      if (this.props.contacts) {
        let contact
        for (const element of this.props.contacts) {
          const fullName = element.givenName && element.familyName ? element.givenName + ' ' + element.familyName : element.givenName
          const found = element.thumbnailPath && UTILS.unspacedLowercase(fullName) === UTILS.unspacedLowercase(tx.metadata.name)
          if (found) {
            contact = element
            break
          }
        }
        if (contact) {
          thumbnailPath = contact.thumbnailPath
        }
      }
    }

    if (completedTxList[tx.key + 1]) {
      // is there a subsequent transaction?
      lastOfDate = tx.dateString !== completedTxList[tx.key + 1].dateString
    } else {
      lastOfDate = false // 'lasteOfDate' may be a misnomer since the very last transaction in the list should have a bottom border
    }

    const stepOne = UTILS.convertNativeToDisplay(this.props.displayDenomination.multiplier)(bns.abs(tx.nativeAmount))

    const amountString = intl.formatNumber(UTILS.decimalOrZero(UTILS.truncateDecimals(stepOne, 6), 6))
    const fiatSymbol = this.props.fiatSymbol || ''
    let fiatAmountString
    if (tx.metadata && tx.metadata.amountFiat) {
      fiatAmountString = bns.abs(tx.metadata.amountFiat.toFixed(2))
      fiatAmountString = intl.formatNumber(bns.toFixed(fiatAmountString, 2, 2), { toFixed: 2 })
    } else {
      fiatAmountString = intl.formatNumber('0.00', { toFixed: 2 })
    }

    const walletBlockHeight = this.props.walletBlockHeight || 0
    const requiredConfirmations = this.props.requiredConfirmations
    let currentConfirmations = 0
    if (walletBlockHeight && tx.blockHeight > 0) {
      currentConfirmations = walletBlockHeight - tx.blockHeight + 1
    }

    if (walletBlockHeight === 0) {
      pendingTimeSyntax = s.strings.fragment_transaction_list_tx_synchronizing
      pendingTimeStyle = styles.transactionPartialConfirmation
    } else if (tx.blockHeight < 0) {
      pendingTimeSyntax = s.strings.fragment_transaction_list_tx_dropped
      pendingTimeStyle = styles.transactionPartialConfirmation
    } else if (currentConfirmations <= 0) {
      // if completely unconfirmed or wallet uninitialized, or wallet lagging behind (tx block height larger than wallet block height)
      pendingTimeStyle = styles.transactionPending
      pendingTimeSyntax = s.strings.fragment_wallet_unconfirmed
    } else if (currentConfirmations < requiredConfirmations) {
      pendingTimeStyle = styles.transactionPartialConfirmation
      pendingTimeSyntax = sprintf(s.strings.fragment_transaction_list_confirmation_progress, currentConfirmations, requiredConfirmations)
    } else {
      pendingTimeStyle = styles.transactionTime
      pendingTimeSyntax = tx.time
    }

    if (tx.metadata && tx.metadata.name) {
      transactionPartner = tx.metadata.name
    } else {
      transactionPartner = txName
    }
    const transactionAmountString = () => {
      if (UTILS.isSentTransaction(tx)) {
        return (
          <T style={styles.transactionDetailsSentTx}>
            - {this.props.displayDenomination.symbol} {amountString}
          </T>
        )
      }
      return (
        <T style={styles.transactionDetailsReceivedTx}>
          + {this.props.displayDenomination.symbol} {amountString}
        </T>
      )
    }
    const transactionMeta = tx ? tx.metadata : null
    const transactionCategory = transactionMeta ? transactionMeta.category : null
    let formattedTransactionCategory = null
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
    const out = (
      <View style={styles.singleTransactionWrap}>
        {(tx.key === 0 || tx.dateString !== completedTxList[tx.key - 1].dateString) && (
          <View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <T style={styles.formattedDate}>{tx.dateString}</T>
            </View>
          </View>
        )}
        <TouchableHighlight
          onPress={() => this.props.onClick(tx, thumbnailPath)}
          underlayColor={THEME.COLORS.ROW_PRESSED}
          style={[styles.singleTransaction, { borderBottomWidth: lastOfDate ? 0 : 1 }]}
        >
          <View style={styles.transactionInfoWrap}>
            <View style={styles.transactionLeft}>
              <View style={styles.transactionLeftLogoWrap}>
                {thumbnailPath ? (
                  <Image style={styles.transactionLogo} source={{ uri: thumbnailPath }} />
                ) : (
                  <Image style={styles.transactionLogo} source={txImage} />
                )}
              </View>
            </View>

            <View style={styles.transactionRight}>
              <View style={[styles.transactionDetailsRow, transactionCategory ? styles.transactionDetailsRowMargin : null]}>
                <T style={styles.transactionPartner} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {transactionPartner}
                </T>
                {transactionAmountString()}
              </View>
              {formattedTransactionCategory ? (
                <View style={styles.transactionDetailsRow}>
                  <T style={styles.transactionCategory}>{formattedTransactionCategory}</T>
                  <T style={styles.transactionFiat}>{`${fiatSymbol} ${fiatAmountString}`}</T>
                </View>
              ) : null}
              {formattedTransactionCategory ? (
                <View style={[styles.transactionDetailsRow, styles.transactionDetailsRowMargin]}>
                  <T style={[styles.transactionPendingTime, pendingTimeStyle]}>{pendingTimeSyntax}</T>
                </View>
              ) : null}
              {!formattedTransactionCategory ? (
                <View style={styles.transactionDetailsRow}>
                  <T style={[styles.transactionPendingTime, pendingTimeStyle]}>{pendingTimeSyntax}</T>
                  <T style={styles.transactionFiat}>{`${fiatSymbol} ${fiatAmountString}`}</T>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
    return out
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
