// @flow

import type { EdgeDenomination } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, StyleSheet, TouchableHighlight, View } from 'react-native'
import { connect } from 'react-redux'

import fioRequestsIcon from '../../../assets/images/fio/fio_sent_request.png'
import * as intl from '../../../locales/intl.js'
import s from '../../../locales/strings'
import { THEME } from '../../../theme/variables/airbitz.js'
import type { State } from '../../../types/reduxTypes'
import type { FioRequest } from '../../../types/types'
import { scale } from '../../../util/scaling.js'
import { getFiatSymbol } from '../../../util/utils'
import { getDisplayDenomination } from '../../Settings/selectors'
import T from '../../UI/components/FormattedText/FormattedText.ui.js'
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
                <Image style={styles.transactionLogo} source={fioRequestsIcon} />
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
    width: scale(44),
    height: scale(44),
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
