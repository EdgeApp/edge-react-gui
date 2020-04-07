// @flow

import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'

import checkedIcon from '../../../assets/images/createWallet/check_icon_lg.png'
import invalidIcon from '../../../assets/images/createWallet/invalid_icon.png'
import fioRequestsIcon from '../../../assets/images/fio/fio_sent_request.png'
import { intl } from '../../../locales/intl'
import s from '../../../locales/strings'
import { styles as requestListStyles } from '../../../styles/scenes/FioRequestListStyle'
import styles from '../../../styles/scenes/TransactionListStyle'
import T from '../../UI/components/FormattedText/index'
import { isRejectedFioRequest, isSentFioRequest } from '../util'

type Props = {
  transaction: any,
  fiatSymbol: string,
  fiatAmount: (currencyCode: string, amount: string) => string,
  onSelect: any => void,
  isHeaderRow?: boolean,
  isSent?: boolean
}

class FioRequestRow extends Component<Props> {
  underlayColor = '#AAA'

  static defaultProps: Props = {
    transaction: {},
    fiatSymbol: '',
    fiatAmount: () => '',
    onSelect: () => {},
    isHeaderRow: false,
    isSent: false
  }

  convertCurrencyStringFromCurrencyCode (code: string) {
    switch (code) {
      case 'BTC':
        return 'Bitcoin'
      case 'BCH':
        return 'Bitcoin Cash'
      case 'ETH':
        return 'Ethereum'
      case 'LTC':
        return 'Litecoin'
      case 'DASH':
        return 'Dash'
      default:
        return ''
    }
  }

  headerRow = (headerDate: Date) => {
    return (
      <View style={requestListStyles.rowContainer}>
        <T style={requestListStyles.rowTitle}>{intl.formatExpDate(headerDate, true)}</T>
      </View>
    )
  }

  sentField = (sentTo: string) => {
    return (
      <View>
        <T style={requestListStyles.title}>{sentTo}</T>
      </View>
    )
  }

  requestedIcon = (status?: string = '') => {
    let icon
    if (isRejectedFioRequest(status)) {
      icon = <Image style={requestListStyles.transactionStatusLogo} source={invalidIcon} />
    }
    if (isSentFioRequest(status)) {
      icon = <Image style={requestListStyles.transactionStatusLogo} source={checkedIcon} />
    }
    return (
      <View>
        <Image style={styles.transactionLogo} source={fioRequestsIcon} />
        {icon}
      </View>
    )
  }

  requestedTimeAndMemo = (time: Date, memo: string) => {
    const maxLength = 40
    const memoStr = memo && memo.length > maxLength ? memo.slice(0, maxLength) + '... ' : memo
    return (
      <View>
        <T style={requestListStyles.text}>
          {intl.formatTime(time)}
          {memoStr ? ` - ${memoStr}` : ''}
        </T>
      </View>
    )
  }

  currencyField = (symbol: string, amount: string, styles: any) => {
    return (
      <View>
        <T style={[requestListStyles.currency, styles]}>
          {symbol} {amount}
        </T>
      </View>
    )
  }

  fiatField = (currencyCode: string, amount: string, styles: any) => {
    return (
      <View>
        <T style={[requestListStyles.fiat, styles]}>
          {this.props.fiatSymbol} {this.props.fiatAmount(currencyCode, amount)}
        </T>
      </View>
    )
  }

  requestedField = (coinType: string) => {
    return (
      <View>
        <T style={requestListStyles.title}>
          {s.strings.title_fio_requested} {this.convertCurrencyStringFromCurrencyCode(coinType)}
        </T>
      </View>
    )
  }

  render () {
    const { transaction, onSelect, isSent, isHeaderRow } = this.props
    return (
      <TouchableHighlight
        onPress={() => onSelect(transaction)}
        style={isHeaderRow ? requestListStyles.rowFrontWithHeader : requestListStyles.rowFront}
        underlayColor={this.underlayColor}
      >
        <View key={transaction.fio_request_id.toString()}>
          {isHeaderRow && <View>{this.headerRow(new Date(transaction.time_stamp))}</View>}
          <View style={requestListStyles.rowItem}>
            <View style={requestListStyles.columnItem}>
              <View>{this.requestedIcon(isSent ? transaction.status : '')}</View>
              <View>
                <View>{isSent ? this.sentField(transaction.payer_fio_address) : this.requestedField(transaction.content.token_code)}</View>
                <View>{this.requestedTimeAndMemo(new Date(transaction.time_stamp), transaction.content.memo)}</View>
              </View>
            </View>
            <View style={requestListStyles.columnCurrency}>
              <View>{this.currencyField(transaction.content.token_code, transaction.content.amount)}</View>
              <View>{this.fiatField(transaction.content.token_code, transaction.content.amount)}</View>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

export default FioRequestRow
