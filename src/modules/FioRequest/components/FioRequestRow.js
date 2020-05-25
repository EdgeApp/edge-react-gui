// @flow

import type { EdgeDenomination } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import { connect } from 'react-redux'

import fioRequestsIcon from '../../../assets/images/fio/fio_sent_request.png'
import { intl } from '../../../locales/intl'
import s from '../../../locales/strings'
import { styles as requestListStyles } from '../../../styles/scenes/FioRequestListStyle'
import styles from '../../../styles/scenes/TransactionListStyle'
import THEME from '../../../theme/variables/airbitz'
import type { State } from '../../../types/reduxTypes'
import type { FioRequest } from '../../../types/types'
import { getFiatSymbol } from '../../../util/utils'
import { getDisplayDenomination } from '../../Settings/selectors'
import T from '../../UI/components/FormattedText/index'
import { getSelectedWallet } from '../../UI/selectors'
import { isRejectedFioRequest, isSentFioRequest } from '../util'

type OwnProps = {
  fioRequest: FioRequest,
  onSelect: FioRequest => void,
  isHeaderRow?: boolean,
  isLastOfDate?: boolean,
  isSent?: boolean
}

type StateProps = {
  fiatSymbol: string,
  fiatAmount: string,
  displayDenomination: EdgeDenomination
}

type Props = OwnProps & StateProps

class FioRequestRow extends Component<Props> {
  underlayColor = THEME.COLORS.ROW_PRESSED
  minimumFontScale = 0.6

  static defaultProps: OwnProps = {
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
      payer_fio_public_key: '',
      status: '',
      time_stamp: ''
    },
    onSelect: () => {},
    isHeaderRow: false,
    isLastOfDate: false,
    isSent: false
  }

  onSelect = () => {
    this.props.onSelect(this.props.fioRequest)
  }

  requestedTimeAndMemo = (time: Date, memo: string) => {
    return (
      <T ellipsizeMode="tail" numberOfLines={1} style={[styles.transactionPendingTime, styles.transactionTime]}>
        {intl.formatTime(time)}
        {memo ? ` - ${memo}` : ''}
      </T>
    )
  }

  currencyField = (amount: string, status: string) => {
    let fieldStyle = styles.transactionPartialConfirmation
    if (status && isSentFioRequest(status)) {
      fieldStyle = styles.transactionDetailsReceivedTx
    }
    if (status && isRejectedFioRequest(status)) {
      fieldStyle = styles.transactionDetailsSentTx
    }

    const symbol = this.props.displayDenomination.symbol || ''

    return (
      <T style={fieldStyle}>
        {symbol} {amount}
      </T>
    )
  }

  requestedField = () => {
    const { displayDenomination, fioRequest } = this.props
    const name = displayDenomination.name || fioRequest.content.token_code
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

  render() {
    const { fioRequest, isSent, isHeaderRow, isLastOfDate, displayDenomination } = this.props
    if (!displayDenomination) return null

    return (
      <View key={fioRequest.fio_request_id.toString()} style={styles.singleTransactionWrap}>
        {isHeaderRow && (
          <View style={styles.singleDateArea}>
            <View style={styles.leftDateArea}>
              <T style={styles.formattedDate}>{intl.formatExpDate(new Date(fioRequest.time_stamp), true)}</T>
            </View>
          </View>
        )}
        <TouchableHighlight
          onPress={this.onSelect}
          underlayColor={this.underlayColor}
          style={[styles.singleTransaction, { borderBottomWidth: isLastOfDate ? 0 : 1 }]}
        >
          <View style={styles.transactionInfoWrap}>
            <View style={styles.transactionLeft}>
              <View style={styles.transactionLeftLogoWrap}>
                <Image style={[styles.transactionLogo, requestListStyles.transactionLogo]} source={fioRequestsIcon} />
              </View>
            </View>

            <View style={styles.transactionRight}>
              <View style={[styles.transactionDetailsRow, fioRequest.content.memo ? styles.transactionDetailsRowMargin : null]}>
                <T style={styles.transactionPartner} adjustsFontSizeToFit minimumFontScale={this.minimumFontScale}>
                  {isSent ? fioRequest.payer_fio_address : this.requestedField()}
                </T>
                {this.currencyField(fioRequest.content.amount, isSent ? fioRequest.status : '')}
              </View>
              <View style={styles.transactionDetailsRow}>
                {this.requestedTimeAndMemo(new Date(fioRequest.time_stamp), fioRequest.content.memo)}
                <T style={styles.transactionFiat}>
                  {this.props.fiatSymbol} {this.props.fiatAmount}
                </T>
              </View>
              {isSent ? <View style={[styles.transactionDetailsRow, styles.transactionDetailsRowMargin]}>{this.showStatus(fioRequest.status)}</View> : null}
            </View>
          </View>
        </TouchableHighlight>
      </View>
    )
  }
}
const emptyDisplayDenomination = { name: '', multiplier: '0' }

const mapStateToProps = (state: State, ownProps: OwnProps) => {
  const { fioRequest } = ownProps
  const wallet = getSelectedWallet(state)
  if (!wallet) {
    return {
      displayDenomination: {},
      fiatSymbol: '',
      fiatAmount: ''
    }
  }
  let displayDenomination = emptyDisplayDenomination
  try {
    displayDenomination = getDisplayDenomination(state, fioRequest.content.token_code)
  } catch (e) {
    console.log('No denomination for this Token Code -', fioRequest.content.token_code)
  }
  const fiatSymbol = getFiatSymbol(wallet.fiatCurrencyCode)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const exchangeRates = state.exchangeRates

  const rateKey = `${fioRequest.content.token_code}_${isoFiatCurrencyCode}`
  const fiatPerCrypto = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
  const amountToMultiply = parseFloat(fioRequest.content.amount)
  const fiatAmount = intl.formatNumber(fiatPerCrypto * amountToMultiply, { toFixed: 2 }) || '0'

  const out: StateProps = {
    displayDenomination,
    fiatSymbol,
    fiatAmount
  }
  return out
}

export const FioRequestRowConnector = connect(mapStateToProps, {})(FioRequestRow)
