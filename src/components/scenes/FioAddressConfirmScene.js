// @flow

import { Scene } from 'edge-components'
import { type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import { FIO_WALLET_TYPE } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import ABSlider from '../../modules/UI/components/Slider/index.js'
import { MaterialInput } from '../../styles/components/FormFieldStyles.js'
import { styles } from '../../styles/scenes/FioAddressConfirmStyle'
import { getFeeDisplayed } from '../../util/utils'
import { FormFieldSelect } from '../common/FormFieldSelect.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'

export type State = {
  selectedWallet: Object | null,
  displayFee: number | null,
  balance: number | null,
  sliderDisabled: boolean | false,
  loading: boolean | false
}

export type StateProps = {
  fioAddressName: string,
  fioWallets: EdgeCurrencyWallet[],
  account: any,
  defaultFiatCode: string,
  isConnected: boolean
}

export type DispatchProps = {
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string) => any,
  changeConfirmSelectedWallet: (selectedWallet: EdgeCurrencyWallet | null, expiration: string, feeCollected: number) => any
}

type Props = StateProps & DispatchProps

export class FioAddressConfirmScene extends Component<Props, State> {
  state: State = {
    selectedWallet: null,
    displayFee: null,
    balance: null,
    sliderDisabled: false,
    loading: false
  }

  async componentDidMount () {
    const { fioWallets } = this.props
    if (fioWallets.length === 0) {
      const wallet: EdgeCurrencyWallet | null = await this.createFioWallet()
      await this.setState({
        selectedWallet: {
          value: wallet ? wallet.name : s.strings.fio_address_register_no_wallet_name,
          wallet
        }
      })
      this.setFeeAndBalance()
    } else if (fioWallets.length > 0) {
      await this.setState({
        selectedWallet: {
          value: fioWallets[0].name,
          wallet: fioWallets[0]
        }
      })
      this.setFeeAndBalance()
    }
  }

  toggleLoading (loading: boolean = false) {
    this.setState({ loading })
  }

  createFioWallet = async (): Promise<EdgeCurrencyWallet | null> => {
    const { createCurrencyWallet, defaultFiatCode } = this.props
    try {
      const wallet = await createCurrencyWallet(s.strings.fio_address_register_default_fio_wallet_name, FIO_WALLET_TYPE, defaultFiatCode)
      return wallet
    } catch (e) {
      return null
    }
  }

  handleFioWalletChange = (value: string, index: number, data: Object) => {
    this.setState({
      selectedWallet: data[index]
    })
    this.setFeeAndBalance()
  }

  saveFioAddress = async () => {
    const { selectedWallet } = this.state
    if (selectedWallet) {
      const { wallet } = selectedWallet
      const { fioAddressName } = this.props
      try {
        const { expiration, feeCollected } = await wallet.otherMethods.fioAction('registerFioAddress', { fioAddress: fioAddressName })
        this.confirmSelected(expiration, feeCollected)
      } catch (e) {
        showError(s.strings.fio_register_address_err_msg)
      }
    }
    this.toggleLoading()
  }

  toggleButton = () => {
    const { displayFee, balance } = this.state
    if (displayFee !== null && balance !== null) {
      if (displayFee > balance) {
        this.setState({
          sliderDisabled: true
        })
      }
    }
  }

  setFeeAndBalance = async () => {
    await this.setFee()
    await this.setBalance()
    this.toggleButton()
  }

  setFee = async () => {
    const { selectedWallet } = this.state
    if (selectedWallet) {
      const { wallet } = selectedWallet
      try {
        const fee = await wallet.otherMethods.getFee('registerFioAddress')
        const displayFee = fee / Constants.BILLION
        this.setState({
          displayFee
        })
      } catch (e) {
        showError(s.strings.fio_get_fee_err_msg)
      }
    }
  }

  setBalance = async () => {
    const { selectedWallet } = this.state
    if (selectedWallet) {
      const { wallet } = selectedWallet
      try {
        const balance = await wallet.getBalance()

        if (balance || balance === 0) {
          const newBalance = balance / Constants.BILLION
          this.setState({
            balance: newBalance
          })
        }
      } catch (e) {
        this.setState({
          balance: 0
        })
      }
    }
  }

  confirmSelected = (expiration: string, feeCollected: number): void => {
    const { selectedWallet } = this.state
    const { changeConfirmSelectedWallet, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    changeConfirmSelectedWallet(selectedWallet && selectedWallet.wallet, expiration, feeCollected)
    window.requestAnimationFrame(() => Actions[Constants.FIO_ADDRESS_REGISTER_SUCCESS]({ registerSuccess: true }))
  }

  onNextPress = () => {
    const { selectedWallet } = this.state
    if (selectedWallet) {
      if (!this.props.isConnected) {
        showError(s.strings.fio_network_alert_text)
        return
      }
      this.toggleLoading(true)
      this.saveFioAddress()
    }
  }

  render () {
    const { fioAddressName, fioWallets } = this.props
    const { selectedWallet, displayFee, balance, loading } = this.state

    const MaterialInputStyle = {
      ...MaterialInput,
      container: {
        ...MaterialInput.container,
        width: '100%'
      }
    }

    return (
      <SceneWrapper>
        <View style={styles.scene}>
          <View style={styles.info}>
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_label}</T>
            <T style={styles.titleLarge}>{fioAddressName}</T>
            <View style={styles.spacer} />
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_registration_label}</T>
            <T style={styles.title}>
              {displayFee ? getFeeDisplayed(displayFee) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
            <View style={styles.spacer} />
            <T style={styles.title}>{s.strings.fio_address_confirm_screen_balance_label}</T>
            <T style={balance && displayFee !== null && displayFee <= balance ? styles.title : styles.titleDisabled}>
              {balance ? balance.toFixed(2) : '0'} {balance ? s.strings.fio_address_confirm_screen_fio_label : ''}
            </T>
          </View>
          {fioWallets && fioWallets.length > 1 && (
            <View style={styles.blockPadding}>
              <View style={styles.select}>
                <FormFieldSelect
                  style={MaterialInputStyle}
                  onChangeText={this.handleFioWalletChange}
                  label={s.strings.fio_address_confirm_screen_select_wallet_label}
                  value={selectedWallet ? selectedWallet.value : ''}
                  data={fioWallets.map(wallet => ({
                    value: wallet.name ? wallet.name : s.strings.fio_address_register_no_wallet_name,
                    wallet
                  }))}
                />
              </View>
            </View>
          )}
          <View style={styles.blockPadding}>
            <Scene.Footer style={styles.footer}>
              <ABSlider
                forceUpdateGuiCounter={false}
                resetSlider={false}
                parentStyle={styles.sliderStyle}
                onSlidingComplete={this.onNextPress}
                sliderDisabled={!balance || (balance !== null && displayFee !== null && displayFee > balance) || !selectedWallet}
                showSpinner={loading}
                disabledText={
                  selectedWallet
                    ? s.strings.fio_address_confirm_screen_disabled_slider_label
                    : s.strings.fio_address_confirm_screen_disabled_slider_nowallet_label
                }
              />
            </Scene.Footer>
          </View>
        </View>
      </SceneWrapper>
    )
  }
}
