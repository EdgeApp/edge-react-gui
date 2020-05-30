// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import { type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { View } from 'react-native'
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

  toggleLoading(loading: boolean = false) {
    this.setState({ loading })
  }

  toggleButton = () => {
    const { fee } = this.props
    const { balance } = this.state
    if (fee !== null && balance !== null) {
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
    const { isConnected, fioAddressName, paymentWallet, ownerPublicKey } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }

    this.toggleLoading(true)

    try {
      const { expiration, feeCollected } = await paymentWallet.otherMethods.fioAction('registerFioAddress', { fioAddress: fioAddressName, ownerPublicKey })
      this.confirmSelected(expiration, feeCollected)
    } catch (e) {
      showError(s.strings.fio_register_address_err_msg)
    }
    this.toggleLoading()
  }

  confirmSelected = (expiration: string, feeCollected: number): void => {
    const { fioAddressName, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    window.requestAnimationFrame(() => Actions[Constants.FIO_ADDRESS_REGISTER_SUCCESS]({ fioAddressName, expiration, feeCollected }))
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
              {fee ? getFeeDisplayed(fee) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
            <View style={styles.spacer} />
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_balance_label}</T>
            <T style={balance && fee !== null && fee <= balance ? styles.title : styles.titleDisabled}>
              {balance ? balance.toFixed(2) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
          </View>
          <View style={styles.blockPadding}>
            <Scene.Footer style={styles.footer}>
              <Slider
                resetSlider={false}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.saveFioAddress}
                sliderDisabled={!balance || (balance !== null && fee !== null && fee > balance)}
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
