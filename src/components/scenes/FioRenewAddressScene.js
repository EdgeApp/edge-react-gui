// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import s from '../../locales/strings'
import { renewFioAddress } from '../../modules/FioAddress/util'
import { Button } from '../../modules/UI/components/ControlPanel/Component/Button/Button.ui'
import T from '../../modules/UI/components/FormattedText/index'
import ABSlider from '../../modules/UI/components/Slider/index.js'
import { styles } from '../../styles/scenes/FioAddressConfirmStyle'
import { truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError, showToast } from '../services/AirshipInstance'

const DIVIDE_PRECISION = 18

type State = {
  loading: boolean,
  renewLoading: boolean,
  displayFee: number,
  balance: number,
  errMsg: string
}

export type StateProps = {
  denominationMultiplier: string,
  isConnected: boolean
}

export type RouteProps = {
  fioWallet: EdgeCurrencyWallet | null,
  fee: number | null,
  fioAddressName: string,
  expiration: Date
}

export type DispatchProps = {
  setFioAddress: (fioAddressName: string, expiration: string) => void,
  refreshAllFioAddresses: () => Promise<void>
}

type Props = StateProps & RouteProps & DispatchProps

export class FioRenewAddressScene extends Component<Props, State> {
  state: State = {
    loading: false,
    renewLoading: false,
    balance: 0,
    displayFee: 0,
    errMsg: ''
  }

  componentDidMount () {
    this.getFee()
    this.setBalance()
  }

  async setBalance () {
    const { fioWallet } = this.props
    if (!fioWallet) return showError(s.strings.fio_address_register_no_wallet_name)
    const balance = await fioWallet.getBalance()
    this.setState({ balance: this.formatFio(balance) })
  }

  getFee () {
    this.toggleLoading(true)
    const { fee } = this.props
    if (fee === null) return
    const displayFee = this.formatFio(`${fee}`)
    this.setState({ displayFee })
    this.toggleLoading()
  }

  toggleLoading (loading: boolean = false) {
    this.setState({ loading })
  }

  toggleRenewLoading (renewLoading: boolean = false) {
    this.setState({ renewLoading })
  }

  formatFio (val: string): number {
    return parseFloat(truncateDecimals(bns.div(val, this.props.denominationMultiplier, DIVIDE_PRECISION), 6))
  }

  onNextPress = async () => {
    const { fioWallet, fioAddressName, fee, isConnected, setFioAddress, refreshAllFioAddresses } = this.props

    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    if (!fioWallet || fee === null) return
    try {
      this.toggleRenewLoading(true)
      const { expiration } = await renewFioAddress(fioWallet, fioAddressName, fee)

      setFioAddress(fioAddressName, expiration)
      refreshAllFioAddresses()

      showToast(s.strings.fio_request_renew_ok_text)
      Actions.pop()
    } catch (e) {
      this.setState({ errMsg: e.message })
    }
    this.toggleRenewLoading()
  }

  renderContent (containerStyles: Object, textStyles: Object = styles.textBlack) {
    const { fioAddressName } = this.props
    const { displayFee, balance, loading, renewLoading, errMsg } = this.state

    return (
      <View style={containerStyles}>
        <View style={styles.texts}>
          <T style={[styles.title, textStyles]}>{s.strings.fio_address_register_form_field_label}</T>
          <T style={[styles.titleLarge, textStyles]}>{fioAddressName}</T>
          <View style={styles.spacer} />
          <T style={[styles.title, textStyles]}>{s.strings.fio_renew_address_fee_label}</T>
          <T style={[styles.title, textStyles]}>
            {displayFee ? `${displayFee} ${s.strings.fio_address_confirm_screen_fio_label}` : s.strings.fio_address_confirm_screen_free_label}
          </T>
          <View style={styles.spacer} />
          {displayFee ? (
            <View>
              <View style={styles.balanceText} />
              <T style={[styles.title, textStyles]}>{s.strings.fio_address_confirm_screen_balance_label}</T>
              <T style={[displayFee > balance ? styles.balanceTitleDisabled : styles.balanceTitle, textStyles]}>
                {balance ? balance.toFixed(2) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
              </T>
            </View>
          ) : (
            <View />
          )}
        </View>
        {displayFee ? (
          <View style={styles.blockPadding}>
            <Scene.Footer style={styles.footer}>
              <ABSlider
                forceUpdateGuiCounter={false}
                resetSlider={false}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.onNextPress}
                sliderDisabled={displayFee > balance}
                showSpinner={renewLoading}
                disabledText={s.strings.fio_address_confirm_screen_disabled_slider_label}
              />
            </Scene.Footer>
          </View>
        ) : (
          <View style={styles.button}>
            <Button disabled={loading} onPress={this.onNextPress} style={styles.toggleButton} underlayColor={styles.underlay.color}>
              <Button.Center>
                <Button.Text>{renewLoading ? <ActivityIndicator size={'small'} /> : <T>{s.strings.fio_renew_label}</T>}</Button.Text>
              </Button.Center>
            </Button>
          </View>
        )}

        {errMsg ? <T style={styles.errMsg}>{errMsg}</T> : <T />}
        {loading && <ActivityIndicator style={styles.activityIndicator} size={'large'} />}
      </View>
    )
  }

  render () {
    const { fee } = this.props

    if (fee) {
      return (
        <SceneWrapper>
          <View style={styles.scene}>{this.renderContent(styles.mainViewBg, styles.textWhite)}</View>
        </SceneWrapper>
      )
    }

    return (
      <SceneWrapper>
        <View style={styles.scene}>{this.renderContent(styles.mainView)}</View>
      </SceneWrapper>
    )
  }
}
