// @flow

import React, { Component } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
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
import { showError } from '../services/AirshipInstance'

export type StateProps = {
  fioAddresses: FioAddress[],
  loading: boolean,
  isConnected: boolean
}

export type DispatchProps = {
  setFioAddress: (fioAddress: string, expiration: string) => void,
  refreshAllFioAddresses: (cb: Function) => Promise<void>
}

export type NavigationProps = {
  navigation: any
}

type Props = StateProps & DispatchProps & NavigationProps

export class FioAddressListScene extends Component<Props> {
  willFocusSubscription = null

  fetchData () {
    const { refreshAllFioAddresses, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
    }
    refreshAllFioAddresses(() => this.checkForFioAddresses())
  }

  componentDidMount () {
    this.willFocusSubscription = this.props.navigation.addListener('willFocus', () => {
      this.fetchData()
    })
  }

  componentWillUnmount () {
    this.willFocusSubscription && this.willFocusSubscription.remove()
  }

  checkForFioAddresses () {
    const { fioAddresses, isConnected } = this.props

    if (fioAddresses.length === 0 && isConnected) {
      Actions[Constants.FIO_ADDRESS]()
    }
  }

  onPress = (fioAddress: string, expirationValue: string) => {
    this.props.setFioAddress(fioAddress, expirationValue)
    Actions[Constants.FIO_ADDRESS_DETAILS]({ fioAddress, expirationValue })
  }

  render () {
    const { fioAddresses, loading } = this.props

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
