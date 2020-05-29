// @flow

import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, Linking, ScrollView, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'

import fioAddressDetailsIcon from '../../assets/images/details_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { FioName } from '../../modules/FioAddress/components/FioName'
import { Button } from '../../modules/UI/components/ControlPanel/Component/Button/Button.ui'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { styles } from '../../styles/scenes/FioAddressListStyle'
import { THEME } from '../../theme/variables/airbitz'
import type { FioAddress, FioDomain } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow'
import { showError } from '../services/AirshipInstance'

export type StateProps = {
  fioAddresses: FioAddress[],
  fioDomains: FioDomain[],
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig | null,
  loading: boolean,
  isConnected: boolean
}

export type DispatchProps = {
  refreshAllFioAddresses: () => Promise<void>
}

export type NavigationProps = {
  navigation: any
}

type Props = StateProps & DispatchProps & NavigationProps

export class FioAddressListScene extends Component<Props> {
  headerIconSize = THEME.rem(1.375)
  willFocusSubscription: { remove: () => void } | null = null

  fetchData() {
    const { refreshAllFioAddresses, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
    }
    refreshAllFioAddresses()
  }

  componentDidMount(): void {
    this.willFocusSubscription = this.props.navigation.addListener('didFocus', () => {
      this.fetchData()
    })
  }

  componentDidUpdate(prevProps: Props): void {
    const { fioAddresses, loading } = this.props

    if (!loading && prevProps.loading) {
      if (fioAddresses.length === 0) {
        Actions[Constants.FIO_ADDRESS_REGISTER]({ noAddresses: true })
      }
    }
  }

  componentWillUnmount(): void {
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

  onAddressPress = (fioAddressName: string, expiration: string) => {
    Actions[Constants.FIO_ADDRESS_DETAILS]({ fioAddressName, expiration })
  }

  onDomainPress = (domain: string, expirationValue: string) => {
    //
  }

  render() {
    const { fioAddresses, fioDomains, loading } = this.props

    if (!fioAddresses.length) {
      return (
        <SceneWrapper>
          <Gradient style={styles.gradient} />
          <ActivityIndicator style={styles.loading} size="large" />
        </SceneWrapper>
      )
    }

    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <ScrollView style={styles.row}>
          <SettingsHeaderRow icon={<Image source={fioAddressDetailsIcon} style={styles.headerIcon} />} text={s.strings.title_fio_address} />
          <View style={styles.list}>
            {fioAddresses.map(address => (
              <FioName key={`${address.name}`} item={address} onPress={this.onAddressPress} />
            ))}
            {loading && <ActivityIndicator style={styles.loading} size="large" />}
          </View>
          <SettingsHeaderRow icon={<IonIcon name="ios-at" color={THEME.COLORS.WHITE} size={this.headerIconSize} />} text={s.strings.title_fio_domains} />
          <View style={styles.list}>
            {!fioDomains.length && (
              <T style={styles.noNames}>
                {s.strings.no} {s.strings.title_fio_domains}
              </T>
            )}
            {fioDomains.map(domain => (
              <FioName key={`${domain.name}`} item={domain} onPress={this.onDomainPress} isDomain />
            ))}
            {loading && <ActivityIndicator style={styles.loading} size="large" />}
          </View>
        </ScrollView>

        <View>
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
          <TouchableOpacity onPress={this.registerDomain} underlayColor={styles.underlay.color}>
            <View>
              <T style={styles.link}>{s.strings.fio_address_reg_domain}</T>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }
}
