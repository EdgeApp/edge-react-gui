// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { Alert, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui.js'
import { styles } from '../../styles/scenes/FioAddressConfirmStyle'
import { getFeeDisplayed, truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'

export type State = {
  balance: number | null,
  sliderDisabled: boolean | false,
  loading: boolean | false
}

export type StateProps = {
  fioPlugin: EdgeCurrencyConfig | null,
  denominationMultiplier: string,
  isConnected: boolean
}

export type NavigationProps = {
  fioAddressName: string,
  paymentWallet: EdgeCurrencyWallet,
  fee: number,
  ownerPublicKey: string
}

type Props = NavigationProps & StateProps

export class FioAddressConfirmScene extends Component<Props, State> {
  state: State = {
    balance: null,
    sliderDisabled: false,
    loading: false
  }

  componentDidMount() {
    this.setBalance()
  }

  toggleButton = () => {
    const { fee } = this.props
    const { balance } = this.state
    if (balance !== null) {
      if (fee > balance) {
        this.setState({
          sliderDisabled: true
        })
      }
    }
  }

  setBalance = async () => {
    const { paymentWallet } = this.props
    try {
      const balance = await paymentWallet.getBalance()

      if (balance != null) {
        const newBalance = parseFloat(truncateDecimals(bns.div(balance, this.props.denominationMultiplier, 18), 6))
        this.setState({
          balance: newBalance
        })
      }

      this.toggleButton()
    } catch (e) {
      this.setState({
        balance: 0
      })
    }
  }

  saveFioAddress = async () => {
    const { isConnected, fioAddressName, paymentWallet, fioPlugin, ownerPublicKey, fee } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }

    this.setState({ loading: true })

    if (!fee) {
      try {
        if (!fioPlugin) {
          throw new Error(s.strings.fio_register_address_err_msg)
        }
        const response = await fioPlugin.otherMethods.buyAddressRequest(
          {
            address: fioAddressName,
            referralCode: fioPlugin.currencyInfo.defaultSettings.defaultRef,
            publicKey: ownerPublicKey
          },
          true
        )
        if (response.error) {
          throw new Error(response.error)
        }
        Alert.alert(
          `${s.strings.fio_address_register_form_field_label} ${s.strings.fragment_wallet_unconfirmed}`,
          s.strings.fio_address_register_pending_free,
          [{ text: s.strings.string_ok_cap }]
        )
        Actions[Constants.WALLET_LIST]()
      } catch (e) {
        showError(e.message)
      }
    } else {
      try {
        const { expiration, feeCollected } = await paymentWallet.otherMethods.fioAction('registerFioAddress', { fioAddress: fioAddressName, ownerPublicKey })
        window.requestAnimationFrame(() => Actions[Constants.FIO_ADDRESS_REGISTER_SUCCESS]({ fioAddressName, expiration, feeCollected }))
      } catch (e) {
        showError(s.strings.fio_register_address_err_msg)
      }
    }
    this.setState({ loading: false })
  }

  render() {
    const { fioAddressName, fee } = this.props
    const { balance, loading } = this.state

    return (
      <SceneWrapper>
        <View style={styles.scene}>
          <View style={styles.info}>
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_label}</T>
            <T style={styles.titleLarge}>{fioAddressName}</T>
            <View style={styles.spacer} />
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_registration_label}</T>
            <T style={styles.title}>
              {fee ? getFeeDisplayed(fee) : s.strings.fio_domain_free} {balance && fee ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
            <View style={styles.spacer} />
            {fee ? (
              <View>
                <T style={styles.title}>{s.strings.fio_address_confirm_screen_balance_label}</T>
                <T style={balance && fee <= balance ? styles.title : styles.titleDisabled}>
                  {balance ? balance.toFixed(2) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
                </T>
              </View>
            ) : null}
          </View>
          <View style={styles.blockPadding}>
            <Scene.Footer style={styles.footer}>
              <Slider
                resetSlider={false}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.saveFioAddress}
                sliderDisabled={(!balance && !!fee) || (balance !== null && fee > balance)}
                showSpinner={loading}
                disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label}
              />
            </Scene.Footer>
          </View>
        </View>
      </SceneWrapper>
    )
  }
}
