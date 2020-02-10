// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import FioAddressItem from '../../components/common/FioAddressItem'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { Button } from '../../modules/UI/components/ControlPanel/Component/Button/Button.ui'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/FioAddressListStyle'
import type { FioAddress, FioDomain } from '../../types/types'
import { showError } from '../services/AirshipInstance'

type WalletAddress = {
  wallet: EdgeCurrencyWallet,
  addresses: FioAddress[]
}
export type State = {
  walletAddresses: WalletAddress[]
}

export type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  isConnected: boolean
}

export type DispatchProps = {
  setFioAddress: (fioAddress: string, expiration: string) => void
}

export type NavigationProps = {
  navigation: any
}

type Props = StateProps & DispatchProps & NavigationProps

export class FioAddressListScene extends Component<Props, State> {
  willFocusSubscription = null
  state: State = {
    walletAddresses: []
  }

  async fetchData () {
    const { fioWallets, isConnected } = this.props
    const walletAddresses = []
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
    }
    for (const fioWallet of fioWallets) {
      const addresses = await this.getAddressFromWallet(fioWallet)
      if (addresses) {
        walletAddresses.push({
          wallet: fioWallet,
          addresses: addresses.fio_addresses
        })
      }
    }

    if (walletAddresses.length === 0 && isConnected) {
      Actions[Constants.FIO_ADDRESS]()
      return
    }

    this.setState({
      walletAddresses
    })
  }

  componentDidMount () {
    this.willFocusSubscription = this.props.navigation.addListener('willFocus', () => {
      this.fetchData()
    })
  }

  componentWillUnmount () {
    this.willFocusSubscription && this.willFocusSubscription.remove()
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

  onPress = (fioAddress: string, expirationValue: string) => {
    this.props.setFioAddress(fioAddress, expirationValue)
    Actions[Constants.FIO_ADDRESS_DETAILS]({ fioAddress, expirationValue })
  }

  render () {
    const { walletAddresses } = this.state

    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <ScrollView style={styles.list}>
          {walletAddresses &&
            walletAddresses.map(walletAddress => {
              const { wallet, addresses } = walletAddress
              return addresses.map(address => (
                <FioAddressItem key={`${wallet.id}-${address.fio_address}`} wallet={wallet} address={address} onFioAddressPress={this.onPress} />
              ))
            })}
        </ScrollView>
        <View style={styles.view}>
          <T>{s.strings.fio_address_first_screen_end}</T>
        </View>
        <View style={styles.button}>
          <Button onPress={() => Actions[Constants.FIO_ADDRESS_REGISTER]()} style={styles.toggleButton} underlayColor={styles.underlay.color}>
            <Button.Center>
              <Button.Text>
                <T>{s.strings.fio_address_list_screen_button_register}</T>
              </Button.Text>
            </Button.Center>
          </Button>
        </View>
      </SafeAreaView>
    )
  }
}
