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

export type StateProps = {
  fioAddresses: FioAddress[],
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig | null,
  loading: boolean,
  isConnected: boolean
}

export type DispatchProps = {
  setFioAddress: (fioAddress: string, expiration: string) => void,
  refreshAllFioAddresses: () => Promise<void>
}

export type NavigationProps = {
  navigation: any
}

type Props = StateProps & DispatchProps & NavigationProps

export class FioAddressListScene extends Component<Props> {
  willFocusSubscription: { remove: () => void } | null = null

  fetchData () {
    const { refreshAllFioAddresses, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
    }
    refreshAllFioAddresses()
  }

  componentDidMount (): void {
    this.willFocusSubscription = this.props.navigation.addListener('didFocus', () => {
      this.fetchData()
    })
  }

  componentDidUpdate (prevProps: Props): void {
    const { fioAddresses, loading, isConnected } = this.props

    if (!loading && prevProps.loading) {
      if (fioAddresses.length === 0 && isConnected) {
        Actions[Constants.FIO_ADDRESS_REGISTER]({ noAddresses: true })
      }
    }
  }

  componentWillUnmount (): void {
    this.willFocusSubscription && this.willFocusSubscription.remove()
  }

  registerDomain = async () => {
    const { fioPlugin, fioWallets } = this.props
    if (!fioPlugin) return
    const publicKey = fioWallets[0].publicWalletInfo.keys.publicKey
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

  onPress = (fioAddress: string, expirationValue: string) => {
    this.props.setFioAddress(fioAddress, expirationValue)
    Actions[Constants.FIO_ADDRESS_DETAILS]({ fioAddress, expirationValue })
  }

  render () {
    const { fioAddresses, loading } = this.props

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
          <Button onPress={Actions[Constants.FIO_ADDRESS_REGISTER]} style={styles.toggleButton} underlayColor={styles.underlay.color}>
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
          <TouchableHighlight onPress={this.registerDomain} underlayColor={styles.underlay.color}>
            <View>
              <T style={styles.link}>{s.strings.fio_address_reg_domain}</T>
            </View>
          </TouchableHighlight>
        </View>
      </SafeAreaView>
    )
  }
}
