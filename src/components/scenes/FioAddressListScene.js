// @flow

import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Linking, ScrollView, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { FioAddressItem } from '../../components/common/FioAddressItem'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { Button } from '../../modules/UI/components/ControlPanel/Component/Button/Button.ui'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { styles } from '../../styles/scenes/FioAddressListStyle'
import type { FioAddress } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'

type State = {
  domainLoading: boolean
}

export type StateProps = {
  fioAddresses: FioAddress[],
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig,
  loading: boolean,
  isConnected: boolean
}

export type DispatchProps = {
  setFioAddress: (fioAddress: string, expiration: string) => void,
  refreshAllFioAddresses: (cb: Function) => Promise<void>,
  createFioWallet: () => Promise<any>
}

export type NavigationProps = {
  navigation: any
}

type Props = StateProps & DispatchProps & NavigationProps

export class FioAddressListScene extends Component<Props, State> {
  willFocusSubscription = null
  state = {
    domainLoading: false
  }

  fetchData () {
    const { refreshAllFioAddresses, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
    }
    refreshAllFioAddresses(() => this.checkForFioAddresses())
  }

  componentDidMount (): void {
    this.willFocusSubscription = this.props.navigation.addListener('didFocus', () => {
      this.fetchData()
    })
  }

  componentWillUnmount () {
    this.willFocusSubscription && this.willFocusSubscription.remove()
  }

  checkForFioAddresses () {
    const { fioAddresses, isConnected } = this.props

    if (fioAddresses.length === 0 && isConnected) {
      Actions[Constants.FIO_ADDRESS_REGISTER]({ noAddresses: true })
    }
  }

  registerDomain = async () => {
    const { fioPlugin, fioWallets, createFioWallet } = this.props
    let publicKey
    if (fioWallets && fioWallets.length) {
      publicKey = fioWallets[0].publicWalletInfo.keys.publicKey
    } else {
      this.setState({ domainLoading: true })
      try {
        const fioWallet = await createFioWallet()
        publicKey = fioWallet.publicWalletInfo.keys.publicKey
      } catch (e) {
        showError(s.strings.create_wallet_failed_message)
      }
      this.setState({ domainLoading: false })
    }
    if (!publicKey) return
    const url = `${await fioPlugin.otherMethods.getRegDomainUrl()}${publicKey}`
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url)
      } else {
        console.log("Don't know how to open URI: " + url)
        showError("Don't know how to open URI: " + url)
      }
    })
  }

  registerAddress () {
    Actions[Constants.FIO_ADDRESS_REGISTER]()
  }

  onPress = (fioAddress: string, expirationValue: string) => {
    this.props.setFioAddress(fioAddress, expirationValue)
    Actions[Constants.FIO_ADDRESS_DETAILS]({ fioAddress, expirationValue })
  }

  render () {
    const { fioAddresses, loading } = this.props
    const { domainLoading } = this.state

    if (!fioAddresses.length) {
      return (
        <SceneWrapper>
          <Gradient style={styles.gradient} />
          <ActivityIndicator style={styles.loading} size={'large'} />
        </SceneWrapper>
      )
    }

    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <ScrollView style={styles.list}>
          {fioAddresses.map(address => (
            <FioAddressItem key={`${address.name}`} address={address} onFioAddressPress={this.onPress} />
          ))}
          {loading && <ActivityIndicator style={styles.loading} size={'large'} />}
        </ScrollView>
        <View style={styles.view}>
          <T>{s.strings.fio_address_first_screen_end}</T>
        </View>
        <View style={styles.button}>
          <Button onPress={this.registerAddress} style={styles.toggleButton} underlayColor={styles.underlay.color}>
            <Button.Center>
              <Button.Text>
                <T>{s.strings.fio_address_list_screen_button_register}</T>
              </Button.Text>
            </Button.Center>
          </Button>
        </View>
        <View style={styles.domainVew}>
          <T>{s.strings.fio_address_reg_domain_label}</T>
        </View>
        <View style={styles.button}>
          <TouchableHighlight disabled={domainLoading} onPress={this.registerDomain} underlayColor={styles.underlay.color}>
            <View>
              {domainLoading ? <ActivityIndicator style={styles.link} size={'small'} /> : <T style={styles.link}>{s.strings.fio_address_reg_domain}</T>}
            </View>
          </TouchableHighlight>
        </View>
      </SafeAreaView>
    )
  }
}
