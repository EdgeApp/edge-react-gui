// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { intl } from '../../locales/intl'
import s from '../../locales/strings'
import { getRenewalFee, renewFioName } from '../../modules/FioAddress/util'
import { PrimaryButton2 } from '../../modules/UI/components/Buttons/PrimaryButton2.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui.js'
import { styles } from '../../styles/scenes/FioAddressSettingsStyle'
import { truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError, showToast } from '../services/AirshipInstance'

const DIVIDE_PRECISION = 18

export type State = {
  showRenew: boolean,
  renewError: string,
  feeLoading: boolean,
  renewalFee: number | null,
  renewLoading: boolean,
  displayFee: number,
  balance: number
}

export type StateProps = {
  denominationMultiplier: string,
  isConnected: boolean
}

export type DispatchProps = {
  refreshAllFioAddresses: () => void
}

export type NavigationProps = {
  fioWallet: EdgeCurrencyWallet,
  fioAddressName: string,
  expiration: string
}

type Props = NavigationProps & StateProps & DispatchProps

export class FioAddressSettingsScene extends Component<Props, State> {
  state: State = {
    showRenew: false,
    renewError: '',
    feeLoading: false,
    renewalFee: null,
    renewLoading: false,
    displayFee: 0,
    balance: 0
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

  formatFio(val: string): number {
    return parseFloat(truncateDecimals(bns.div(val, this.props.denominationMultiplier, DIVIDE_PRECISION), 6))
  }

  onRenewPress = async () => {
    this.setBalance()
    this.setFee()
  }

  onConfirm = async () => {
    const { fioWallet, fioAddressName, isConnected, refreshAllFioAddresses } = this.props
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
      window.requestAnimationFrame(() => {
        Actions.refresh({ fioAddressName, expiration: intl.formatExpDate(expiration) })
      })
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
            <View style={styles.balanceText} />
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
    const { fioAddressName, expiration } = this.props
    const { feeLoading, displayFee, balance, renewalFee, renewLoading, showRenew } = this.state

    return (
      <SceneWrapper>
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
            <Scene.Footer style={styles.footer}>
              <Slider
                forceUpdateGuiCounter={0}
                resetSlider={false}
                onSlidingComplete={this.onConfirm}
                sliderDisabled={displayFee > balance}
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
