// @flow

import type { EdgeDenomination } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'

import fioRequestsIcon from '../../../assets/images/fio/fio_sent_request.png'
import { intl } from '../../../locales/intl'
import s from '../../../locales/strings'
import { styles as requestListStyles } from '../../../styles/scenes/FioRequestListStyle'
import styles from '../../../styles/scenes/TransactionListStyle'
import THEME from '../../../theme/variables/airbitz'
import type { FioRequest } from '../../../types/types'
import T from '../../UI/components/FormattedText/index'
import { isRejectedFioRequest, isSentFioRequest } from '../util'

type Props = {
  fioRequest: FioRequest,
  fiatSymbol: string,
  fiatAmount: (currencyCode: string, amount: string) => string,
  onSelect: any => void,
  displayDenominations: { [string]: EdgeDenomination },
  isHeaderRow?: boolean,
  isLastOfDate?: boolean,
  isSent?: boolean
}

class FioRequestRow extends Component<Props> {
  underlayColor = THEME.COLORS.ROW_PRESSED

  static defaultProps: Props = {
    fioRequest: {
      fio_request_id: '',
      content: {
        payee_public_address: '',
        amount: '',
        token_code: '',
        chain_code: '',
        memo: ''
      },
      payee_fio_address: '',
      payer_fio_address: '',
      status: '',
      time_stamp: ''
    },
    fiatSymbol: '',
    displayDenominations: {},
    fiatAmount: () => '',
    onSelect: () => {},
    isHeaderRow: false,
    isLastOfDate: false,
    isSent: false
  }

  requestedTimeAndMemo = (time: Date, memo: string) => {
    const maxLength = 34
    const memoStr = memo && memo.length > maxLength ? memo.slice(0, maxLength) + '... ' : memo
    return (
      <T style={[styles.transactionPendingTime, styles.transactionTime]}>
        {intl.formatTime(time)}
        {memoStr ? ` - ${memoStr}` : ''}
      </T>
    )
  }

  currencyField = (currencyCode: string, amount: string, status: string) => {
    let fieldStyle = styles.transactionPartialConfirmation
    if (status && isSentFioRequest(status)) {
      fieldStyle = styles.transactionDetailsReceivedTx
    }
    if (status && isRejectedFioRequest(status)) {
      fieldStyle = styles.transactionDetailsSentTx
    }

    const symbol = this.props.displayDenominations[currencyCode] ? this.props.displayDenominations[currencyCode].symbol : ''

    return (
      <T style={fieldStyle}>
        {symbol} {amount}
      </T>
    )
  }

  fiatField = (currencyCode: string, amount: string) => {
    return (
      <T style={[styles.transactionFiat]}>
        {this.props.fiatSymbol} {this.props.fiatAmount(currencyCode, amount)}
      </T>
    )
  }

  requestedField = (currencyCode: string) => {
    const name = this.props.displayDenominations[currencyCode] ? this.props.displayDenominations[currencyCode].name : ''
    return `${s.strings.title_fio_requested} ${name}`
  }

  showStatus = (status: string) => {
    let statusStyle = styles.transactionPartialConfirmation
    let label = s.strings.fragment_wallet_unconfirmed
    if (isSentFioRequest(status)) {
      statusStyle = styles.transactionDetailsReceivedTx
      label = s.strings.fragment_transaction_list_receive_prefix
    }
    if (isRejectedFioRequest(status)) {
      statusStyle = styles.transactionPending
      label = s.strings.fio_reject_status
    }
    return <T style={[styles.transactionPendingTime, statusStyle]}>{label}</T>
  }

  render () {
    const { fioRequest, onSelect, isSent, isHeaderRow, isLastOfDate } = this.props
    return (
      <View key={fioRequest.fio_request_id.toString()} style={[styles.singleTransactionWrap]}>
        {isHeaderRow && (
          <View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <T style={styles.formattedDate}>{intl.formatExpDate(new Date(fioRequest.time_stamp), true)}</T>
            </View>
          </View>
        )}
        <TouchableHighlight
          onPress={() => onSelect(fioRequest)}
          underlayColor={this.underlayColor}
          style={[styles.singleTransaction, { borderBottomWidth: isLastOfDate ? 0 : 1 }]}
        >
          <View style={[styles.transactionInfoWrap]}>
            <View style={styles.transactionLeft}>
              <View style={[styles.transactionLeftLogoWrap]}>
                <Image style={[styles.transactionLogo, requestListStyles.transactionLogo]} source={fioRequestsIcon} />
              </View>
            </View>

            <View style={[styles.transactionRight]}>
              <View style={[styles.transactionDetailsRow, fioRequest.content.memo ? styles.transactionDetailsRowMargin : null]}>
                <T style={[styles.transactionPartner]} adjustsFontSizeToFit={true} minimumFontScale={0.6}>
                  {isSent ? fioRequest.payer_fio_address : this.requestedField(fioRequest.content.token_code)}
                </T>
                {this.currencyField(fioRequest.content.token_code, fioRequest.content.amount, isSent ? fioRequest.status : '')}
              </View>
              <View style={[styles.transactionDetailsRow]}>
                {this.requestedTimeAndMemo(new Date(fioRequest.time_stamp), fioRequest.content.memo)}
                {this.fiatField(fioRequest.content.token_code, fioRequest.content.amount)}
              </View>
              {isSent ? <View style={[styles.transactionDetailsRow, styles.transactionDetailsRowMargin]}>{this.showStatus(fioRequest.status)}</View> : null}
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}

export default FioRequestRow
