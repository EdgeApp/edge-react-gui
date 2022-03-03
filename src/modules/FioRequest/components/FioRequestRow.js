// @flow

import { mul } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import { ClickableRow } from '../../../components/themed/ClickableRow'
import { EdgeText } from '../../../components/themed/EdgeText'
import { formatNumber, formatTime } from '../../../locales/intl.js'
import s from '../../../locales/strings'
import { getDisplayDenomination } from '../../../selectors/DenominationSelectors.js'
import { getSelectedWallet } from '../../../selectors/WalletSelectors.js'
import { connect } from '../../../types/reactRedux.js'
import { type FioRequest, type GuiWallet } from '../../../types/types'
import { getFiatSymbol } from '../../../util/utils'
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
    const currencyValue = `${this.props.displayDenomination.symbol || ''} ${fioRequest.content.amount}`
    const dateValue = `${formatTime(new Date(fioRequest.time_stamp))} ${fioRequest.content.memo ? `- ${fioRequest.content.memo}` : ''}`
    return (
      <ClickableRow onPress={this.onSelect} highlight gradient>
        <FontAwesome name={isSent ? 'paper-plane' : 'history'} style={styles.icon} />

        <View style={styles.requestRight}>
          <View style={styles.requestDetailsRow}>
            <EdgeText style={styles.name}>{isSent ? fioRequest.payer_fio_address : fioRequest.payee_fio_address}</EdgeText>
            <EdgeText style={styles.requestAmount}>{currencyValue}</EdgeText>
          </View>
          <View style={styles.requestDetailsRow}>
            <EdgeText ellipsizeMode="tail" numberOfLines={1} style={[styles.requestPendingTime, styles.requestTime]}>
              {dateValue}
            </EdgeText>
            <EdgeText style={styles.requestFiat}>{fiatValue}</EdgeText>
          </View>
          <View style={styles.requestDetailsRow}>{isSent ? this.showStatus(fioRequest.status) : this.requestedField()}</View>
        </View>
      </ClickableRow>
    )
  }
}
const emptyDisplayDenomination = { name: '', multiplier: '0' }

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
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

export const FioRequestRowConnector = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { fioRequest } = ownProps
    let displayDenomination = emptyDisplayDenomination
    const wallet: GuiWallet = getSelectedWallet(state)
    if (!wallet) {
      return {
        displayDenomination,
        fiatSymbol: '',
        fiatAmount: ''
      }
    }
    const tokenCode = fioRequest.content.token_code.toUpperCase()
    try {
      const { allCurrencyInfos } = state.ui.settings.plugins
      const plugin = allCurrencyInfos.find(plugin => {
        const { currencyCode: pluginCurrencyCode } = plugin
        if (pluginCurrencyCode == null) return false
        return pluginCurrencyCode.toUpperCase() === fioRequest.content.chain_code.toUpperCase()
      })

      if (plugin == null) throw new Error(`No plugin match for this chain code - ${fioRequest.content.chain_code.toUpperCase()}`)
      displayDenomination = getDisplayDenomination(state, plugin.pluginId, tokenCode)
    } catch (e) {
      console.log('No denomination for this Token Code -', tokenCode)
    }
    const fiatSymbol = getFiatSymbol(wallet.fiatCurrencyCode)
    const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
    const exchangeRates = state.exchangeRates

    const rateKey = `${tokenCode}_${isoFiatCurrencyCode}`
    const fiatPerCrypto = exchangeRates[rateKey] ?? '0'
    const fiatAmount = formatNumber(mul(fiatPerCrypto, fioRequest.content.amount), { toFixed: 2 }) || '0'

    return {
      displayDenomination,
      fiatSymbol,
      fiatAmount
    }
  },
  dispatch => ({})
)(withTheme(FioRequestRow))
