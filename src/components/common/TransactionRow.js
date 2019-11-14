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
import type { GuiWallet, TransactionListTx } from '../../types/types.js'
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

    // Work around corrupted metadata from another GUI bug:
    if (tx.metadata != null && tx.metadata.name != null && typeof tx.metadata.name !== 'string') {
      tx.metadata.name = ''
    }

    let lastOfDate, txImage, pendingTimeSyntax, transactionPartner
    let txName = ''
    let thumbnailPath = ''

    let currencyName = this.props.uiWallet.currencyNames[this.props.selectedCurrencyCode]
    if (!currencyName) {
      currencyName = this.props.selectedCurrencyCode
    }
    if (UTILS.isSentTransaction(tx)) {
      // XXX -paulvp Why is this hard coded here?
      txName = SENT_TEXT + currencyName
      txImage = sentTypeImage
    } else {
      txName = RECEIVED_TEXT + currencyName
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
    } else if (tx.blockHeight < 0) {
      pendingTimeSyntax = s.strings.fragment_transaction_list_tx_dropped
    } else if (currentConfirmations <= 0) {
      // if completely unconfirmed or wallet uninitialized, or wallet lagging behind (tx block height larger than wallet block height)
      pendingTimeSyntax = UNCONFIRMED_TRANSACTION
    } else if (currentConfirmations < requiredConfirmations) {
      pendingTimeSyntax = sprintf(CONFIRMATION_PROGRESS_TEXT, currentConfirmations, requiredConfirmations)
    } else {
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
            </View>

            <View style={[styles.transactionRight]}>
              <View style={[styles.transactionDetailsRow, transactionCategory ? styles.transactionDetailsRowMargin : null]}>
                <T style={[styles.transactionPartner]} adjustsFontSizeToFit={true} minimumFontScale={0.6}>
                  {transactionPartner}
                </T>
                {transactionAmountString()}
              </View>
              <View style={[styles.transactionDetailsRow]}>
                <T style={[styles.transactionCategory]}>{transactionCategory || pendingTimeSyntax}</T>
                <T style={[styles.transactionFiat]}>{`${fiatSymbol} ${fiatAmountString}`}</T>
              </View>
              {transactionCategory ? (
                <View style={[styles.transactionDetailsRow, styles.transactionDetailsRowMargin]}>
                  <T style={[styles.transactionPendingTime]}>{pendingTimeSyntax}</T>
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
