// @flow

import { mul } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants.js'
import { formatNumber, formatTime } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { isRejectedFioRequest, isSentFioRequest } from '../../modules/FioRequest/util.js'
import { getDisplayDenomination } from '../../selectors/DenominationSelectors.js'
import { getSelectedWallet } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type FioRequest, type GuiWallet } from '../../types/types.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ClickableRow } from './ClickableRow.js'
import { EdgeText } from './EdgeText.js'
import { type SwipableRowRef, SwipeableRow } from './SwipeableRow.js'
import { SwipeableRowIcon } from './SwipeableRowIcon.js'

type OwnProps = {
  // The request:
  fioRequest: FioRequest,
  isSent: boolean,

  onPress: (request: FioRequest) => void,
  onSwipe: (request: FioRequest) => Promise<void>
}

type StateProps = {
  fiatSymbol: string,
  fiatAmount: string,
  displayDenomination: EdgeDenomination
}

type Props = OwnProps & StateProps & ThemeProps

class FioRequestRowComponent extends React.PureComponent<Props> {
  rowRef: { current: SwipableRowRef | null } = React.createRef()

  closeRow = () => {
    if (this.rowRef.current != null) this.rowRef.current.close()
  }

  onPress = () => {
    const { onPress, fioRequest } = this.props
    onPress(fioRequest)
    this.closeRow()
  }

  onSwipe = () => {
    const { onSwipe, fioRequest } = this.props
    onSwipe(fioRequest).finally(this.closeRow)
  }

  requestedField = () => {
    const { displayDenomination, fioRequest, theme } = this.props
    const styles = getStyles(theme)
    const name = displayDenomination.name || fioRequest.content.token_code.toUpperCase()
    const value = `${s.strings.title_fio_requested} ${name}`

    return <EdgeText style={styles.requestPendingTime}>{value}</EdgeText>
  }

  showStatus = (status: string) => {
    const { theme } = this.props
    const styles = getStyles(theme)

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
    const { displayDenomination, fiatAmount, fiatSymbol, fioRequest, isSent, theme } = this.props
    const styles = getStyles(theme)

    const fiatValue = `${fiatSymbol} ${fiatAmount}`
    const currencyValue = `${displayDenomination.symbol || ''} ${fioRequest.content.amount}`
    // time_stamp is returned as UTC but doesn't always include the zulu
    const safeDate = fioRequest.time_stamp.includes('Z') ? fioRequest.time_stamp : `${fioRequest.time_stamp}Z`
    const dateValue = `${formatTime(new Date(safeDate))} ${fioRequest.content.memo ? `- ${fioRequest.content.memo}` : ''}`
    return (
      <SwipeableRow
        ref={this.rowRef}
        renderRight={
          // We are only swipeable if we aren't already cancelled or rejected:
          isSentFioRequest(fioRequest.status) || isRejectedFioRequest(fioRequest.status)
            ? undefined
            : (isActive: SharedValue<boolean>) => (
                <TouchableOpacity style={styles.underlay} onPress={this.onSwipe}>
                  <SwipeableRowIcon isActive={isActive} minWidth={theme.rem(7)}>
                    <EdgeText>{isSent ? s.strings.string_cancel_cap : s.strings.swap_terms_reject_button}</EdgeText>
                  </SwipeableRowIcon>
                </TouchableOpacity>
              )
        }
        rightDetent={theme.rem(7)}
        rightThreshold={theme.rem(7.5)}
        onRightSwipe={this.onSwipe}
      >
        <ClickableRow gradient highlight paddingRem={[0, 1]} onPress={this.onPress}>
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

const emptyDisplayDenomination = { name: '', multiplier: '0' }

export const FioRequestRow = connect<StateProps, {}, OwnProps>(
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
    const fiatSymbol = getSymbolFromCurrency(wallet.fiatCurrencyCode)
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
)(withTheme(FioRequestRowComponent))
