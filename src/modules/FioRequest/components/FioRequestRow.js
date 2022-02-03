// @flow

import { bns } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import { ClickableRow } from '../../../components/themed/ClickableRow'
import { EdgeText } from '../../../components/themed/EdgeText'
import { FiatText } from '../../../components/themed/FiatText'
import { formatTime } from '../../../locales/intl.js'
import s from '../../../locales/strings'
import { getDisplayDenomination } from '../../../selectors/DenominationSelectors.js'
import { getCurrencyWallets } from '../../../selectors/WalletSelectors.js'
import { connect } from '../../../types/reactRedux.js'
import { type FioRequest } from '../../../types/types'
import { getWalletFiat } from '../../../util/CurrencyWalletHelpers'
import { isRejectedFioRequest, isSentFioRequest } from '../util'

type OwnProps = {
  fioRequest: FioRequest,
  onSelect: FioRequest => void,
  isSent?: boolean
}

type StateProps = {
  displayDenomination: EdgeDenomination,
  isoFiatCurrencyCode: string
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
    const { fioRequest, isSent, displayDenomination, theme, isoFiatCurrencyCode } = this.props
    const styles = getStyles(theme)
    if (!displayDenomination || !isoFiatCurrencyCode) return null

    const currencyValue = `${this.props.displayDenomination.symbol || ''} ${fioRequest.content.amount}`
    const dateValue = `${formatTime(new Date(fioRequest.time_stamp))} ${fioRequest.content.memo ? `- ${fioRequest.content.memo}` : ''}`
    const nativeCryptoAmount = bns.mul(fioRequest.content.amount, displayDenomination.multiplier)
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
            <EdgeText style={styles.requestFiat}>
              <FiatText
                nativeCryptoAmount={nativeCryptoAmount}
                cryptoCurrencyCode={fioRequest.content.chain_code}
                isoFiatCurrencyCode={isoFiatCurrencyCode}
                cryptoExchangeMultiplier={displayDenomination.multiplier}
                parenthesisEnclosed
              />
            </EdgeText>
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
    const tokenCode = fioRequest.content.token_code.toUpperCase()

    let displayDenomination = emptyDisplayDenomination
    let currencyWallet, isoFiatCurrencyCode
    try {
      currencyWallet = getCurrencyWallets(state, fioRequest.content.chain_code)[0]
      displayDenomination = getDisplayDenomination(state, currencyWallet.currencyInfo.pluginId, tokenCode)
      isoFiatCurrencyCode = getWalletFiat(currencyWallet).isoFiatCurrencyCode
    } catch (e) {
      // TODO: Handle as typed error, include the offending fioRequest
      // console.log('No denomination for this Token Code -', tokenCode)
    }

    return {
      displayDenomination,
      isoFiatCurrencyCode
    }
  },
  dispatch => ({})
)(withTheme(FioRequestRow))
