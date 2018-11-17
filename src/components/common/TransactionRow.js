// @flow

import { bns } from 'biggystring'
import type { EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import receivedTypeImage from '../../assets/images/transactions/transaction-type-received.png'
import sentTypeImage from '../../assets/images/transactions/transaction-type-sent.png'
import { intl } from '../../locales/intl'
import s from '../../locales/strings'
import T from '../../modules/UI/components/FormattedText/index'
import type { ContactsState } from '../../reducers/ContactsReducer'
import styles, { styles as styleRaw } from '../../styles/scenes/TransactionListStyle'
import type { GuiWallet, TransactionListTx } from '../../types'
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

type State = {}

const SENT_TEXT = s.strings.fragment_transaction_list_sent_prefix
const RECEIVED_TEXT = s.strings.fragment_transaction_list_receive_prefix
const CONFIRMATION_PROGRESS_TEXT = s.strings.fragment_transaction_list_confirmation_progress
const UNCONFIRMED_TRANSACTION = s.strings.fragment_wallet_unconfirmed

type Props = TransactionRowOwnProps & TransactionRowStateProps

export class TransactionRowComponent extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  shouldComponentUpdate (nextProps: Props) {
    const diffElement = UTILS.getObjectDiff(this.props, nextProps, { transaction: true }, { transactions: true })
    if (diffElement) {
      return true
    } else {
      return false
    }
  }

  render () {
    global.pcount && global.pcount('TransactionRow:render')
    const completedTxList: Array<TransactionListTx> = this.props.transactions
    // $FlowFixMe
    const tx = this.props.transaction.item
    let txColorStyle, lastOfDate, txImage, pendingTimeStyle, pendingTimeSyntax, transactionPartner
    let txName = ''
    let thumbnailPath = ''

    let currencyName = this.props.uiWallet.currencyNames[this.props.selectedCurrencyCode]
    if (!currencyName) {
      currencyName = this.props.selectedCurrencyCode
    }
    if (UTILS.isSentTransaction(tx)) {
      // XXX -paulvp Why is this hard coded here?
      txColorStyle = styles.accentRed
      txName = SENT_TEXT + currencyName
      txImage = sentTypeImage
    } else {
      txColorStyle = styles.accentGreen
      txName = RECEIVED_TEXT + currencyName
      txImage = receivedTypeImage
    }

    if (tx.metadata && tx.metadata.name) {
      if (this.props.contacts) {
        const contact = this.props.contacts.find(element => {
          const fullName = element.givenName && element.familyName ? element.givenName + ' ' + element.familyName : element.givenName
          const found = element.thumbnailPath && UTILS.unspacedLowercase(fullName) === UTILS.unspacedLowercase(tx.metadata.name)
          // if (found) console.log('element is: ', element)
          return found
        })
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

    const { walletBlockHeight, requiredConfirmations } = this.props
    if (tx.blockHeight <= 0 || walletBlockHeight === null) {
      // if completely unconfirmed or wallet uninitialized
      pendingTimeStyle = styles.transactionPending
      pendingTimeSyntax = UNCONFIRMED_TRANSACTION
      // if partial confirmation (less than currency threshold)
      // subtract 1 from requiredConfirmations because one confirmation is when wallet and tx block heights match (difference is zero)
    } else if (walletBlockHeight - tx.blockHeight < requiredConfirmations - 1) {
      const currentConfirmations = walletBlockHeight - tx.blockHeight + 1
      pendingTimeStyle = styles.transactionPartialConfirmation
      // keep in mind that if the tx.blockHeight is not -1 the that means it must have had at least one confirmation
      pendingTimeSyntax = sprintf(CONFIRMATION_PROGRESS_TEXT, currentConfirmations > 0 ? currentConfirmations : 0, requiredConfirmations)
      // if confirmed past threshold
    } else {
      pendingTimeStyle = styles.transactionTime
      pendingTimeSyntax = tx.time
    }

    if (tx.metadata && tx.metadata.name) {
      transactionPartner = tx.metadata.name
    } else {
      transactionPartner = txName
    }
    const out = (
      <View style={[styles.singleTransactionWrap]}>
        {(tx.key === 0 || tx.dateString !== completedTxList[tx.key - 1].dateString) && (
          <View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <T style={styles.formattedDate}>{tx.dateString}</T>
            </View>
          </View>
        )}
        <TouchableHighlight
          onPress={() => this.props.onClick(tx, thumbnailPath)}
          underlayColor={styleRaw.transactionUnderlay.color}
          style={[styles.singleTransaction, { borderBottomWidth: lastOfDate ? 0 : 1 }]}
        >
          <View style={[styles.transactionInfoWrap]}>
            <View style={styles.transactionLeft}>
              <View style={[styles.transactionLeftLogoWrap]}>
                {thumbnailPath ? (
                  <Image style={[styles.transactionLogo]} source={{ uri: thumbnailPath }} />
                ) : (
                  <Image style={styles.transactionLogo} source={txImage} />
                )}
              </View>

              <View style={[styles.transactionLeftTextWrap]}>
                <T style={[styles.transactionPartner]} adjustsFontSizeToFit={true} minimumFontScale={0.6}>
                  {transactionPartner}
                </T>
                <T style={[styles.transactionTimePendingArea, pendingTimeStyle]}>{pendingTimeSyntax}</T>
              </View>
            </View>

            <View style={[styles.transactionRight]}>
              <T style={[styles.transactionBitAmount, txColorStyle, styles.symbol]}>
                {this.props.displayDenomination.symbol} {amountString}
              </T>
              <T style={[styles.transactionDollarAmount, txColorStyle]}>{fiatSymbol + ' ' + fiatAmountString}</T>
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
    return out
  }
}
