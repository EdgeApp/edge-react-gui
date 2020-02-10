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
import styles from '../../styles/scenes/FioAddressConfirmStyle'
import type { FioAddress, FioDomain, IsConnectedProp } from '../../types/types'
import { getFeeDisplayed } from '../../util/utils'
import { FormFieldSelect } from '../common/FormFieldSelect.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'

type WalletAddress = {
  wallet: EdgeCurrencyWallet,
  addresses: FioAddress[]
}
export type State = {
  walletAddresses: WalletAddress[],
  selectedWallet: Object | null,
  fee: number | null,
  displayFee: number | null,
  balance: number | null,
  sliderDisabled: boolean | false,
  loading: boolean | false
}

export type StateProps = {
  fioAddressName: string,
  fioWallets: EdgeCurrencyWallet[],
  account: any,
  isConnected: boolean
}

export type DispatchProps = {
  createCurrencyWallet: (walletName: string, walletType: string) => any,
  changeConfirmSelectedWallet: (selectedWallet: EdgeCurrencyWallet | null, expiration: Date, fee_collected: number) => any
}

type Props = StateProps & IsConnectedProp & DispatchProps

export class FioAddressConfirmScene extends Component<Props, State> {
  state: State = {
    walletAddresses: [],
    selectedWallet: null,
    fee: null,
    displayFee: null,
    balance: null,
    sliderDisabled: false,
    loading: false
  }

  async fetchData () {
    const { fioWallets } = this.props
    const walletAddresses = []
    for (const fioWallet of fioWallets) {
      const addresses = await this.getAddressFromWallet(fioWallet)
      if (addresses) {
        walletAddresses.push({
          wallet: fioWallet,
          addresses: addresses.fio_addresses
        })
      }
    }

    this.setState({
      walletAddresses
    })
  }

  async componentDidMount () {
    this.fetchData()
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
    const { createCurrencyWallet } = this.props
    try {
      const wallet = await createCurrencyWallet(s.strings.fio_address_register_default_fio_wallet_name, FIO_WALLET_TYPE)
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
    const { selectedWallet, fee } = this.state
    if (selectedWallet) {
      const { wallet } = selectedWallet
      const { fioAddressName } = this.props
      try {
        await wallet.otherMethods.registerFioAddress(fioAddressName, fee)
        this.confirmSelected()
      } catch (e) {
        showError(s.strings.fio_register_address_err_msg)
      }
    }
    this.toggleLoading()
  }

  getAddressFromWallet = async (
    wallet: EdgeCurrencyWallet
  ): Promise<{
    fio_domains: FioDomain[],
    fio_addresses: FioAddress[]
  } | null> => {
    try {
      const receiveAddress = await wallet.getReceiveAddress()
      const fioNames = await wallet.otherMethods.fioAction('getFioNames', { fioPublicKey: receiveAddress.publicAddress })
      return fioNames
    } catch (e) {
      return null
    }
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
        const obj = await wallet.otherMethods.fioAction('getFee', { endPoint: 'register_fio_address', fioAddress: '' })
        if (obj) {
          if (obj.fee) {
            const displayFee = obj.fee / Constants.BILLION
            this.setState({
              fee: obj.fee,
              displayFee
            })
          }
        }
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
        const obj = await wallet.otherMethods.fioAction('getFioBalance', {})

        if (obj) {
          if (obj.balance || obj.balance === 0) {
            const newBalance = obj.balance / Constants.BILLION
            this.setState({
              balance: newBalance
            })
          }
        }
      } catch (e) {
        this.setState({
          balance: 0
        })
      }
    }
  }

  confirmSelected = async () => {
    const { selectedWallet } = this.state
    const { changeConfirmSelectedWallet, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    if (selectedWallet) {
      const { wallet } = selectedWallet
      const { fioAddressName } = this.props
      try {
        const receiveAddress = await wallet.getReceiveAddress()
        const fioNames = await wallet.otherMethods.fioAction('getFioNames', { fioPublicKey: receiveAddress.publicAddress })

        let name = ''
        if (fioNames) {
          if (fioNames.fio_addresses) {
            name = fioNames.fio_addresses.find(item => item.fio_address === fioAddressName)
            if (name) {
              if (name.expiration) {
                changeConfirmSelectedWallet(selectedWallet, new Date(name.expiration), 300000)
                window.requestAnimationFrame(() => Actions[Constants.FIO_ADDRESS_REGISTER_SUCCESS]({ registerSuccess: true }))
              }
            }
          }
        }
      } catch (e) {
        //
      }
    } else {
      changeConfirmSelectedWallet(selectedWallet, new Date(), 300000)
      window.requestAnimationFrame(() => Actions[Constants.FIO_ADDRESS_REGISTER_SUCCESS]({ registerSuccess: true }))
    }
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
