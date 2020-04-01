// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import type { ExchangeRatesState } from '../../modules/ExchangeRates/reducer'
import { isRejectedFioRequest, isSentFioRequest } from '../../modules/FioRequest/util'
import T from '../../modules/UI/components/FormattedText/index'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/FioSentRequestDetailsStyle.js'
import { SceneWrapper } from '../common/SceneWrapper'

export type FioSentRequestDetailsProps = {
  selectedFioSentRequest: any,
  isoFiatCurrencyCode: any,
  exchangeRates: ExchangeRatesState
}

export type FioSentRequestDetailsDispatchProps = {}

type Props = FioSentRequestDetailsProps & FioSentRequestDetailsDispatchProps

type LocalState = {
  memo: string,
  focused: boolean
}

export class FioSentRequestDetailsComponent extends Component<Props, LocalState> {
  constructor (props: Props) {
    super(props)
    const state: LocalState = {
      memo: '',
      focused: false
    }
    this.state = state
  }

  fiatAmount = (currencyCode: string, amount: string) => {
    const { exchangeRates, isoFiatCurrencyCode } = this.props
    let fiatPerCrypto
    if (currencyCode === Constants.FIO_STR) {
      fiatPerCrypto = 1
    } else {
      const rateKey = `${currencyCode}_${isoFiatCurrencyCode}`
      fiatPerCrypto = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
    }
    const amountToMultiply = parseFloat(amount)

    return (fiatPerCrypto * amountToMultiply).toFixed(2)
  }

  amountField = (amount: string, currencyCode: string, cryptoSymbol: string, currencySymbol: string) => {
    return (
      <View style={styles.row}>
        <T style={styles.title}>
          Amount: {amount} {cryptoSymbol} ({currencySymbol}
          {this.fiatAmount(currencyCode, amount)})
        </T>
      </View>
    )
  }

  requestedField = (payer: string, status: string) => {
    let statusLabel = (
      <T style={styles.title}>
        {s.strings.title_fio_requested} {s.strings.fragment_transaction_list_sent_prefix}
        {s.strings.word_to_in_convert_from_to_string}
      </T>
    )
    if (isSentFioRequest(status)) {
      statusLabel = <T style={[styles.title, styles.titleReceived]}>{s.strings.fragment_transaction_list_receive_prefix}</T>
    }
    if (isRejectedFioRequest(status)) {
      statusLabel = <T style={[styles.title, styles.titleRejected]}>{s.strings.fio_reject_status}</T>
    }
    return (
      <View style={styles.row}>
        {statusLabel}
        <T style={styles.title}>{payer}</T>
      </View>
    )
  }

  memoField = (memo: string) => {
    if (memo) {
      return (
        <View style={styles.row}>
          <T style={styles.title}>Memo</T>
          <T style={styles.title}>{memo}</T>
        </View>
      )
    }

    return <View style={styles.row} />
  }

  dateField = (date: Date) => {
    return (
      <View style={styles.row}>
        <T style={styles.title}>{s.strings.fio_date_label}</T>
        <T style={styles.title}>{intl.formatExpDate(date, true)}</T>
      </View>
    )
  }

  render () {
    return (
      <SceneWrapper>
        <SafeAreaView>
          <View>
            {this.amountField(
              this.props.selectedFioSentRequest.content.amount,
              this.props.selectedFioSentRequest.content.token_code,
              this.props.selectedFioSentRequest.content.token_code,
              '$'
            )}
          </View>
          <View>{this.requestedField(this.props.selectedFioSentRequest.payer_fio_address, this.props.selectedFioSentRequest.status)}</View>
          <View>{this.dateField(new Date(this.props.selectedFioSentRequest.time_stamp))}</View>
          <View>{this.memoField(this.props.selectedFioSentRequest.content.memo)}</View>
          <View style={styles.row2}>
            <View style={styles.line} />
          </View>
        </SafeAreaView>
      </SceneWrapper>
    )
  }
}
