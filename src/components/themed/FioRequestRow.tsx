import { mul, toFixed } from 'biggystring'
import { EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { formatNumber, formatTime } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { getSelectedCurrencyWallet } from '../../selectors/WalletSelectors'
import { connect } from '../../types/reactRedux'
import { FioRequest, FioRequestStatus } from '../../types/types'
import { getCryptoText } from '../../util/cryptoTextUtils'
import { convertEdgeToFIOCodes, convertFIOToEdgeCodes } from '../../util/FioAddressUtils'
import { SwipeableRowIcon } from '../icons/SwipeableRowIcon'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { ClickableRow } from './ClickableRow'
import { EdgeText } from './EdgeText'
import { SwipableRowRef, SwipeableRow } from './SwipeableRow'

interface OwnProps {
  // The request:
  fioRequest: FioRequest
  isSent: boolean

  onPress: (request: FioRequest) => Promise<void> | void
  onSwipe: (request: FioRequest) => Promise<void>
}

interface StateProps {
  fiatSymbol: string
  fiatAmount: string
  displayDenomination: EdgeDenomination
  exchangeDenomination: EdgeDenomination
}

type Props = OwnProps & StateProps & ThemeProps

class FioRequestRowComponent extends React.PureComponent<Props> {
  rowRef = React.createRef<SwipableRowRef>()

  closeRow = () => {
    if (this.rowRef.current != null) this.rowRef.current.close()
  }

  onPress = () => {
    const { onPress, fioRequest } = this.props
    onPress(fioRequest)?.catch(err => showError(err))
    this.closeRow()
  }

  onSwipe = () => {
    const { onSwipe, fioRequest } = this.props
    onSwipe(fioRequest)
      .catch(err => showError(err))
      .finally(this.closeRow)
  }

  requestedField = () => {
    const { displayDenomination, fioRequest, theme } = this.props
    const styles = getStyles(theme)
    const name = displayDenomination.name || fioRequest.content.token_code.toUpperCase()
    const value = `${lstrings.title_fio_requested} ${name}`

    return <EdgeText style={styles.requestPendingTime}>{value}</EdgeText>
  }

  showStatus = (status: FioRequestStatus) => {
    const { theme } = this.props
    const styles = getStyles(theme)

    let statusStyle = styles.requestPartialConfirmation
    let label = lstrings.fragment_wallet_unconfirmed
    if (status === 'sent_to_blockchain') {
      statusStyle = styles.requestDetailsReceivedTx
      label = lstrings.fragment_transaction_list_receive_prefix
    } else if (status === 'rejected') {
      statusStyle = styles.requestPending
      label = lstrings.fio_reject_status
    }
    return <EdgeText style={[styles.requestPendingTime, statusStyle]}>{label}</EdgeText>
  }

  render() {
    const { displayDenomination, exchangeDenomination, fiatAmount, fiatSymbol, fioRequest, isSent, theme } = this.props
    const styles = getStyles(theme)

    const fiatText = `${fiatSymbol} ${fiatAmount}`
    let nativeAmount = mul(fioRequest.content.amount, exchangeDenomination.multiplier)
    nativeAmount = toFixed(nativeAmount, 0, 0)
    const cryptoText = `${getCryptoText({ displayDenomination, exchangeDenomination, nativeAmount })}`

    // time_stamp is returned as UTC but doesn't always include the zulu
    const safeDate = fioRequest.time_stamp.includes('Z') ? fioRequest.time_stamp : `${fioRequest.time_stamp}Z`
    const dateValue = `${formatTime(new Date(safeDate))} ${fioRequest.content.memo ? `- ${fioRequest.content.memo}` : ''}`
    return (
      <SwipeableRow
        ref={this.rowRef}
        renderRight={
          // We are only swipeable if we aren't already cancelled or rejected:
          fioRequest.status === 'sent_to_blockchain' || fioRequest.status === 'rejected'
            ? undefined
            : (isActive: SharedValue<boolean>) => (
                <TouchableOpacity style={styles.underlay} onPress={this.onSwipe}>
                  <SwipeableRowIcon isActive={isActive} minWidth={theme.rem(7)}>
                    <EdgeText>{isSent ? lstrings.string_cancel_cap : lstrings.swap_terms_reject_button}</EdgeText>
                  </SwipeableRowIcon>
                </TouchableOpacity>
              )
        }
        rightDetent={theme.rem(7)}
        rightThreshold={theme.rem(7.5)}
        onRightSwipe={this.onSwipe}
      >
        <ClickableRow paddingRem={[0, 1]} onPress={this.onPress}>
          <FontAwesome name={isSent ? 'paper-plane' : 'history'} style={styles.icon} />

          <View style={styles.requestRight}>
            <View style={styles.requestDetailsRow}>
              <EdgeText style={styles.name}>{isSent ? fioRequest.payer_fio_address : fioRequest.payee_fio_address}</EdgeText>
              <EdgeText style={styles.requestAmount}>{cryptoText}</EdgeText>
            </View>
            <View style={styles.requestDetailsRow}>
              <EdgeText ellipsizeMode="tail" numberOfLines={1} style={[styles.requestPendingTime, styles.requestTime]}>
                {dateValue}
              </EdgeText>
              <EdgeText style={styles.requestFiat}>{fiatText}</EdgeText>
            </View>
            <View style={styles.requestDetailsRow}>{isSent ? this.showStatus(fioRequest.status) : this.requestedField()}</View>
          </View>
        </ClickableRow>
      </SwipeableRow>
    )
  }
}

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
  },
  underlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.sliderTabSend,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }
}))

const emptyDenomination = { name: '', multiplier: '0' }

export const FioRequestRow = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const { fioRequest } = ownProps
    let displayDenomination = emptyDenomination
    let exchangeDenomination = emptyDenomination
    const wallet = getSelectedCurrencyWallet(state)
    if (!wallet) {
      return {
        exchangeDenomination,
        displayDenomination,
        fiatSymbol: '',
        fiatAmount: ''
      }
    }
    let tokenCode = fioRequest.content.token_code.toUpperCase()
    try {
      const { currencyConfig } = state.core.account
      const pluginId = Object.keys(currencyConfig).find(pluginId => {
        const { currencyCode: pluginCurrencyCode } = currencyConfig[pluginId].currencyInfo
        if (pluginCurrencyCode == null) return false
        const { fioChainCode } = convertEdgeToFIOCodes(pluginId, pluginCurrencyCode, tokenCode)
        return fioChainCode === fioRequest.content.chain_code.toUpperCase()
      })

      if (pluginId == null) throw new Error(`No plugin match for this chain code - ${fioRequest.content.chain_code.toUpperCase()}`)
      const { tokenCode: edgeTokenCode } = convertFIOToEdgeCodes(pluginId, fioRequest.content.chain_code.toUpperCase(), tokenCode)
      tokenCode = edgeTokenCode
      displayDenomination = getDisplayDenomination(state, pluginId, tokenCode)
      exchangeDenomination = getExchangeDenomination(state, pluginId, tokenCode)
    } catch (e: any) {
      console.log('No denomination for this Token Code -', tokenCode)
    }
    const fiatSymbol = getSymbolFromCurrency(wallet.fiatCurrencyCode.replace('iso:', ''))
    const isoFiatCurrencyCode = wallet.fiatCurrencyCode
    const exchangeRates = state.exchangeRates

    const rateKey = `${tokenCode}_${isoFiatCurrencyCode}`
    const fiatPerCrypto = exchangeRates[rateKey] ?? '0'
    const fiatAmount = formatNumber(mul(fiatPerCrypto, fioRequest.content.amount), { toFixed: 2 }) || '0'

    return {
      exchangeDenomination,
      displayDenomination,
      fiatSymbol,
      fiatAmount
    }
  },
  dispatch => ({})
)(withTheme(FioRequestRowComponent))
