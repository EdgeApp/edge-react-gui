// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { FIO_STR } from '../../constants/WalletAndCurrencyConstants'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings'
import { refreshAllFioAddresses } from '../../modules/FioAddress/action'
import { getRenewalFee, renewFioName } from '../../modules/FioAddress/util'
import { getDisplayDenomination } from '../../modules/Settings/selectors'
import { PrimaryButton2 } from '../../modules/UI/components/Buttons/PrimaryButton2.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes'
import type { FioAddress } from '../../types/types'
import { truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError, showToast } from '../services/AirshipInstance'

const DIVIDE_PRECISION = 18

export type LocalState = {
  showRenew: boolean,
  renewError: string,
  feeLoading: boolean,
  renewalFee: number | null,
  renewLoading: boolean,
  displayFee: number,
  balance: number
}

export type StateProps = {
  fioAddresses: FioAddress[],
  denominationMultiplier: string,
  isConnected: boolean
}

export type DispatchProps = {
  refreshAllFioAddresses: () => void
}

export type NavigationProps = {
  fioWallet: EdgeCurrencyWallet,
  fioAddressName: string,
  expiration?: string,
  showRenew?: boolean,
  refreshAfterRenew?: boolean
}

type Props = NavigationProps & StateProps & DispatchProps

class FioAddressSettingsComponent extends React.Component<Props, LocalState> {
  state: LocalState = {
    showRenew: false,
    renewError: '',
    feeLoading: false,
    renewalFee: null,
    renewLoading: false,
    displayFee: 0,
    balance: 0
  }

  componentDidMount(): * {
    const { showRenew, refreshAllFioAddresses } = this.props
    refreshAllFioAddresses()
    if (showRenew) {
      this.setBalance()
      this.setFee()
    }
  }

  setFee = async (): Promise<void> => {
    const { fioWallet } = this.props
    let renewalFee = null
    let displayFee = 0
    let showRenew = false
    if (fioWallet) {
      this.setState({ feeLoading: true })
      try {
        renewalFee = await getRenewalFee(fioWallet)
        if (renewalFee) {
          displayFee = this.formatFio(`${renewalFee}`)
          showRenew = true
        }
      } catch (e) {
        showError(e.message)
        this.setState({ renewError: e.message })
      }
      this.setState({ renewalFee, displayFee, showRenew, feeLoading: false })
    }
  }

  setBalance = async (): Promise<void> => {
    const { fioWallet } = this.props
    if (fioWallet) {
      const balance = await fioWallet.getBalance()
      this.setState({ balance: this.formatFio(balance) })
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
  }

  getExpiration = (): string => {
    const { fioAddresses, fioAddressName } = this.props
    const fioAddress = fioAddresses.find(({ name }) => fioAddressName === name)
    if (fioAddress) return formatDate(fioAddress.expiration)
    return ''
  }

  formatFio(val: string): number {
    return parseFloat(truncateDecimals(bns.div(val, this.props.denominationMultiplier, DIVIDE_PRECISION), 6))
  }

  onRenewPress = async () => {
    this.setBalance()
    this.setFee()
  }

  onConfirm = async () => {
    const { fioWallet, fioAddressName, isConnected, refreshAllFioAddresses, refreshAfterRenew } = this.props
    const { renewalFee } = this.state

    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }

    if (!fioWallet) {
      showError(s.strings.fio_wallet_missing_for_fio_address)
      this.setState({ renewError: s.strings.fio_wallet_missing_for_fio_address })
      return
    }

    if (renewalFee === null) {
      showError(s.strings.fio_get_fee_err_msg)
      this.setState({ renewError: s.strings.fio_get_fee_err_msg })
      return
    }

    try {
      this.setState({ renewLoading: true })
      const { expiration } = await renewFioName(fioWallet, fioAddressName, renewalFee)

      refreshAllFioAddresses()

      this.setState({ showRenew: false })
      showToast(s.strings.fio_request_renew_ok_text)
      Actions.pop()
      if (refreshAfterRenew) {
        window.requestAnimationFrame(() => {
          Actions.refresh({ fioAddressName, expiration: formatDate(expiration) })
        })
      }
    } catch (e) {
      showError(e.message)
      this.setState({ renewError: e.message })
    }
    this.setState({ renewLoading: false })
  }

  renderFeeAndBalance() {
    const { feeLoading, displayFee, balance, renewError, showRenew } = this.state

    if (!feeLoading && renewError) {
      return (
        <View>
          <T style={styles.title}>{renewError}</T>
        </View>
      )
    }

    if (feeLoading || !showRenew) return null

    return (
      <View style={styles.texts}>
        <View style={styles.spacer} />
        <View style={styles.spacer} />
        <T style={styles.title}>{s.strings.fio_renew_fee_label}</T>
        <T style={styles.content}>
          {displayFee ? `${displayFee} ${s.strings.fio_address_confirm_screen_fio_label}` : s.strings.fio_address_confirm_screen_free_label}
        </T>
        <View style={styles.spacer} />
        {displayFee ? (
          <View>
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_balance_label}</T>
            <T style={displayFee > balance ? styles.balanceTitleDisabled : styles.balanceTitle}>
              {balance ? balance.toFixed(2) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
          </View>
        ) : null}
      </View>
    )
  }

  render() {
    const { fioAddressName } = this.props
    let { expiration } = this.props
    const { feeLoading, displayFee, balance, renewalFee, renewLoading, showRenew } = this.state

    if (!expiration) {
      expiration = this.getExpiration()
    }

    return (
      <SceneWrapper background="header">
        <View style={styles.info}>
          <T style={styles.title}>{s.strings.fio_address_register_form_field_label}</T>
          <T style={styles.content}>{fioAddressName}</T>
        </View>
        <View style={styles.info}>
          <T style={styles.title}>{s.strings.fio_address_details_screen_expires}</T>
          <T style={styles.content}>{expiration}</T>
        </View>
        {!showRenew && (
          <View style={styles.blockPadding}>
            <PrimaryButton2 onPress={this.onRenewPress} disabled={feeLoading}>
              {feeLoading ? <ActivityIndicator size="small" /> : <PrimaryButton2.Text>{s.strings.title_fio_renew_address}</PrimaryButton2.Text>}
            </PrimaryButton2>
          </View>
        )}
        {this.renderFeeAndBalance()}
        {showRenew && renewalFee !== null && !feeLoading ? (
          <View style={styles.blockPadding}>
            <Scene.Footer>
              <Slider
                forceUpdateGuiCounter={0}
                resetSlider={false}
                onSlidingComplete={this.onConfirm}
                sliderDisabled={displayFee > balance || renewLoading}
                showSpinner={renewLoading}
                disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label}
              />
            </Scene.Footer>
          </View>
        ) : null}
      </SceneWrapper>
    )
  }
}

const rawStyles = {
  info: {
    backgroundColor: THEME.COLORS.SECONDARY,
    paddingVertical: THEME.rem(1),
    paddingHorizontal: THEME.rem(1),
    marginBottom: THEME.rem(0.25)
  },
  title: {
    color: THEME.COLORS.TRANSACTION_DETAILS_GREY_1,
    marginBottom: THEME.rem(0.25),
    fontSize: THEME.rem(0.75),
    fontWeight: 'normal',
    textAlign: 'left'
  },
  content: {
    color: THEME.COLORS.WHITE,
    fontSize: THEME.rem(1),
    textAlign: 'left'
  },
  texts: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  balanceTitle: {
    fontSize: THEME.rem(1),
    color: THEME.COLORS.WHITE,
    textAlign: 'center'
  },
  balanceTitleDisabled: {
    fontSize: THEME.rem(1),
    color: THEME.COLORS.ACCENT_RED,
    fontWeight: 'normal',
    textAlign: 'center'
  },
  blockPadding: {
    paddingTop: THEME.rem(2),
    paddingLeft: THEME.rem(1.25),
    paddingRight: THEME.rem(1.25)
  },
  spacer: {
    paddingTop: THEME.rem(1.25)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

const mapStateToProps = (state: RootState) => {
  const displayDenomination = getDisplayDenomination(state, FIO_STR)

  const out: StateProps = {
    fioAddresses: state.ui.scenes.fioAddress.fioAddresses,
    denominationMultiplier: displayDenomination.multiplier,
    isConnected: state.network.isConnected
  }

  return out
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  refreshAllFioAddresses: () => {
    dispatch(refreshAllFioAddresses())
  }
})

export const FioAddressSettingsScene = connect(mapStateToProps, mapDispatchToProps)(FioAddressSettingsComponent)
