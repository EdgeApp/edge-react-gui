// @flow

import React, { Component } from 'react'
import { Image, ScrollView, Text, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import buysellIcon from '../../../../../assets/images/sidenav/buysell.png'
import exchangeIcon from '../../../../../assets/images/sidenav/exchange.png'
import logoutImage from '../../../../../assets/images/sidenav/logout.png'
import receiveIcon from '../../../../../assets/images/sidenav/receive.png'
import scanIcon from '../../../../../assets/images/sidenav/scan.png'
import settings from '../../../../../assets/images/sidenav/settings.png'
import sweepIcon from '../../../../../assets/images/sidenav/sweep.png'
import termsIcon from '../../../../../assets/images/sidenav/terms.png'
import walletIcon from '../../../../../assets/images/sidenav/wallets.png'
import * as Constants from '../../../../../constants/indexConstants.js'
import s from '../../../../../locales/strings.js'
import styles from '../style'
import { Button } from './Button/Button.ui.js'
import { Separator } from './Separator/Separator.ui.js'
import UserList from './UserListConnector'

const WALLETS_TEXT = s.strings.drawer_wallets
const SCAN_TEXT = s.strings.drawer_scan_qr_send
const SWEEP_PRIVATE_KEY_TEXT = s.strings.drawer_sweep_private_key
const REQUEST_TEXT = s.strings.drawer_request
const EXCHANGE_TEXT = s.strings.drawer_exchange
const LOGOUT_TEXT = s.strings.settings_button_logout
const SETTINGS_TEXT = s.strings.settings_title
const PLUGIN_BUYSELL_TEXT = s.strings.title_plugin_buysell
const TERMS_OF_SERVICE_TEXT = s.strings.title_terms_of_service

export type Props = {
  logout: (username?: string) => void,
  usersView: boolean
}
export default class Main extends Component<Props> {
  render () {
    const { usersView } = this.props

    return usersView ? (
      <UserList />
    ) : (
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <ScrollView>
          <View>
            <View>
              <Separator />
              <BuySellButton />
              <Separator />
              <WalletsButton />
              <Separator />
              <ScanButton />
              <Separator />
              <SweepPrivateKeyButton />
              <Separator />
              <RequestButton />
              <Separator />
              <ExchangeButton />
              <Separator />
              <TermsOfServiceButton />
              <Separator />
            </View>
          </View>
        </ScrollView>
        <View>
          <Separator />
          <LogoutButton onPress={this.handleLogout} />
          <Separator />
          <SettingsButton />
        </View>
      </View>
    )
  }

  handleLogout = () => {
    this.props.logout()
  }
}

const BuySellButton = () => {
  return (
    <Button onPress={Actions.buysell}>
      <Button.Row>
        <Button.Row>
          <Button.Left>
            <Image source={buysellIcon} style={styles.iconImage} />
          </Button.Left>

          <Button.Center>
            <Button.Text>
              <Text>{PLUGIN_BUYSELL_TEXT}</Text>
            </Button.Text>
          </Button.Center>
        </Button.Row>
      </Button.Row>
    </Button>
  )
}

const popToWalletListScene = () => Actions.popTo('walletListScene')
const WalletsButton = () => {
  return (
    <Button onPress={popToWalletListScene}>
      <Button.Row>
        <Button.Row>
          <Button.Left>
            <Image source={walletIcon} style={styles.iconImage} />
          </Button.Left>

          <Button.Center>
            <Button.Text>
              <Text>{WALLETS_TEXT}</Text>
            </Button.Text>
          </Button.Center>
        </Button.Row>
      </Button.Row>
    </Button>
  )
}

const ScanButton = () => {
  return (
    <Button onPress={Actions.scan}>
      <Button.Row>
        <Button.Left>
          <Image source={scanIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{SCAN_TEXT}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const SweepPrivateKeyButton = () => {
  return (
    <Button onPress={Actions.scan}>
      <Button.Row>
        <Button.Left>
          <Image source={sweepIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{SWEEP_PRIVATE_KEY_TEXT}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const RequestButton = () => {
  return (
    <Button onPress={Actions.request}>
      <Button.Row>
        <Button.Left>
          <Image source={receiveIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{REQUEST_TEXT}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const ExchangeButton = () => {
  return (
    <Button onPress={Actions.exchange}>
      <Button.Row>
        <Button.Left>
          <Image source={exchangeIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{EXCHANGE_TEXT}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const TermsOfServiceButton = () => {
  return (
    <Button onPress={Actions[Constants.TERMS_OF_SERVICE]}>
      <Button.Row>
        <Button.Left>
          <Image source={termsIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{TERMS_OF_SERVICE_TEXT}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const SettingsButton = () => {
  return (
    <Button onPress={Actions.settingsOverviewTab}>
      <Button.Row>
        <Button.Left>
          <Image style={[styles.iconImage, { height: 20, width: 20 }]} source={settings} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{SETTINGS_TEXT}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const LogoutButton = ({ onPress }) => {
  return (
    <Button onPress={onPress}>
      <Button.Row>
        <Button.Left>
          <Image style={[styles.iconImage, { height: 20, width: 20 }]} source={logoutImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{LOGOUT_TEXT}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}
