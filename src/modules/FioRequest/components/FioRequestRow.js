// @flow

import type { EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { TouchableHighlight, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { connect } from 'react-redux'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { formatNumber, formatTime } from '../../../locales/intl.js'
import s from '../../../locales/strings'
import { type RootState } from '../../../types/reduxTypes'
import type { FioRequest } from '../../../types/types'
import { getFiatSymbol } from '../../../util/utils'
import { getDisplayDenomination } from '../../Settings/selectors'
import { Gradient } from '../../UI/components/Gradient/Gradient.ui'
import { getSelectedWallet } from '../../UI/selectors'
import { isRejectedFioRequest, isSentFioRequest } from '../util'

type OwnProps = {
  fioRequest: FioRequest,
  onSelect: FioRequest => void,
  isSent?: boolean
}

type StateProps = {
  fiatSymbol: string,
  fiatAmount: string,
  displayDenomination: EdgeDenomination
}

type Props = OwnProps & StateProps & ThemeProps

class FioRequestRow extends React.PureComponent<Props> {
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
    isSent: false
  }

  onSelect = () => {
    this.props.onSelect(this.props.fioRequest)
  }

  requestedTimeAndMemo = (time: Date, memo: string) => {
    const styles = getStyles(this.props.theme)
    const value = `${formatTime(time)} ${memo ? `- ${memo}` : ''}`
    return (
      <EdgeText ellipsizeMode="tail" numberOfLines={1} style={[styles.requestPendingTime, styles.requestTime]}>
        {value}
      </EdgeText>
    )
  }

  currencyField = (amount: string) => {
    const styles = getStyles(this.props.theme)
    const value = `${this.props.displayDenomination.symbol || ''} ${amount}`

    return <EdgeText style={styles.requestAmount}>{value}</EdgeText>
  }

  requestedField = () => {
    const { displayDenomination, fioRequest, theme } = this.props
    const styles = getStyles(theme)
    const name = displayDenomination.name || fioRequest.content.token_code.toUpperCase()
    const value = `${s.strings.title_fio_requested} ${name}`

    return <EdgeText style={styles.requestPendingTime}>{value}</EdgeText>
  }

  showStatus = (status: string) => {
    const styles = getStyles(this.props.theme)

    let statusStyle = styles.requestPartialConfirmation
    let label = s.strings.fragment_wallet_unconfirmed
    if (isSentFioRequest(status)) {
      statusStyle = styles.requestDetailsReceivedTx
      label = s.strings.fragment_transaction_list_receive_prefix
    }
    if (isRejectedFioRequest(status)) {
      statusStyle = styles.requestPending
      label = s.strings.fio_reject_status
    }
    return <EdgeText style={[styles.requestPendingTime, statusStyle]}>{label}</EdgeText>
  }

  render() {
    const { fioRequest, isSent, displayDenomination, theme } = this.props
    const styles = getStyles(theme)
    if (!displayDenomination) return null

    const fiatValue = `${this.props.fiatSymbol} ${this.props.fiatAmount}`
    return (
      <TouchableHighlight onPress={this.onSelect} underlayColor={theme.backgroundGradientLeft}>
        <Gradient style={styles.row}>
          <View style={styles.requestInfoWrap}>
            <View style={styles.requestLeft}>
              <FontAwesome name={isSent ? 'paper-plane' : 'history'} style={styles.icon} />
            </View>

            <View style={styles.requestRight}>
              <View style={styles.requestDetailsRow}>
                <EdgeText style={styles.name}>{isSent ? fioRequest.payer_fio_address : fioRequest.payee_fio_address}</EdgeText>
                {this.currencyField(fioRequest.content.amount)}
              </View>
              <View style={styles.requestDetailsRow}>
                {this.requestedTimeAndMemo(new Date(fioRequest.time_stamp), fioRequest.content.memo)}
                <EdgeText style={styles.requestFiat}>{fiatValue}</EdgeText>
              </View>
              <View style={styles.requestDetailsRow}>{isSent ? this.showStatus(fioRequest.status) : this.requestedField()}</View>
            </View>
          </View>
        </Gradient>
      </TouchableHighlight>
    )
  }
}
const emptyDisplayDenomination = { name: '', multiplier: '0' }

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    paddingRight: theme.rem(1),
    paddingLeft: theme.rem(1)
  },
  requestInfoWrap: {
    flex: 1,
    flexDirection: 'row',
    paddingBottom: theme.rem(0.5),
    paddingTop: theme.rem(0.375)
  },
  requestLeft: {
    flexDirection: 'row'
  },
  icon: {
    marginTop: theme.rem(1.5),
    marginRight: theme.rem(1),
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  name: {
    flex: 1,
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  requestRight: {
    flex: 1
  },
  requestTime: {
    color: theme.secondaryText
  },
  requestPending: {
    color: theme.negativeText
  },
  requestAmount: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  requestPartialConfirmation: {
    color: theme.warningText
  },
  requestDetailsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingBottom: theme.rem(0.125)
  },
  requestDetailsReceivedTx: {
    color: theme.textLink
  },
  requestDetailsSentTx: {
    color: theme.negativeText
  },
  requestFiat: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  requestPendingTime: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.deactivatedText
  }
}))

const mapStateToProps = (state: RootState, ownProps: OwnProps) => {
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
  const tokenCode = fioRequest.content.token_code.toUpperCase()
  try {
    displayDenomination = getDisplayDenomination(state, tokenCode)
  } catch (e) {
    console.log('No denomination for this Token Code -', tokenCode)
  }
  const fiatSymbol = getFiatSymbol(wallet.fiatCurrencyCode)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const exchangeRates = state.exchangeRates

  const rateKey = `${tokenCode}_${isoFiatCurrencyCode}`
  const fiatPerCrypto = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
  const amountToMultiply = parseFloat(fioRequest.content.amount)
  const fiatAmount = formatNumber(fiatPerCrypto * amountToMultiply, { toFixed: 2 }) || '0'

  const out: StateProps = {
    displayDenomination,
    fiatSymbol,
    fiatAmount
  }
  return out
}

export const FioRequestRowConnector = connect(mapStateToProps, {})(withTheme(FioRequestRow))
