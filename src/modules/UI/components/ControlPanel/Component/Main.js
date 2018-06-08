// @flow

import React, { Component } from 'react'
import { Image, Text, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import exchangeIcon from '../../../../../assets/images/sidenav/exchange.png'
import receiveIcon from '../../../../../assets/images/sidenav/receive.png'
import scanIcon from '../../../../../assets/images/sidenav/scan.png'
import walletIcon from '../../../../../assets/images/sidenav/wallets.png'

import logoutImage from '../../../../../assets/images/sidenav/logout.png'
import settings from '../../../../../assets/images/sidenav/settings.png'

import s from '../../../../../locales/strings.js'
import styles from '../style'
import UserList from './UserListConnector'
import { Button } from './Button/Button.ui.js'
import { Separator } from './Separator/Separator.ui.js'

const WALLETS_TEXT = s.strings.drawer_wallets
const SCAN_TEXT = s.strings.drawer_scan_qr_send
const SWEEP_PRIVATE_KEY_TEXT = s.strings.drawer_sweep_private_key
const REQUEST_TEXT = s.strings.drawer_request
const EXCHANGE_TEXT = s.strings.drawer_exchange
const LOGOUT_TEXT = s.strings.settings_button_logout
const SETTINGS_TEXT = s.strings.settings_title

export type Props = {
  logout: (username?: string) => void,
  usersView: boolean
}
export default class Main extends Component<Props> {
  render () {
    const { logout, usersView } = this.props

    return usersView ? (
      <UserList />
    ) : (
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Separator />

          <Button onPress={Actions.walletList}>
            <Button.Left>
              <Image source={walletIcon} />
            </Button.Left>

            <Button.Center>
              <Button.Text>
                <Text>{WALLETS_TEXT}</Text>
              </Button.Text>
            </Button.Center>
          </Button>

          <Separator />

          <Button onPress={Actions.scan}>
            <Button.Left>
              <Image source={scanIcon} />
            </Button.Left>

            <Button.Center>
              <Button.Text>
                <Text>{SCAN_TEXT}</Text>
              </Button.Text>
            </Button.Center>
          </Button>

          <Separator />

          <Button onPress={Actions.scan}>
            <Button.Left>
              <Image source={scanIcon} />
            </Button.Left>

            <Button.Center>
              <Button.Text>
                <Text>{SWEEP_PRIVATE_KEY_TEXT}</Text>
              </Button.Text>
            </Button.Center>
          </Button>

          <Separator />

          <Button onPress={Actions.request}>
            <Button.Left>
              <Image source={receiveIcon} />
            </Button.Left>

            <Button.Center>
              <Button.Text>
                <Text>{REQUEST_TEXT}</Text>
              </Button.Text>
            </Button.Center>
          </Button>

          <Separator />

          <Button onPress={Actions.exchange}>
            <Button.Left>
              <Image source={exchangeIcon} />
            </Button.Left>

            <Button.Center>
              <Button.Text>
                <Text>{EXCHANGE_TEXT}</Text>
              </Button.Text>
            </Button.Center>
          </Button>

          <Separator />
        </View>

        <View>
          <Separator />

          <Button onPress={logout}>
            <Button.Left>
              <Image style={styles.iconImage} source={logoutImage} />
            </Button.Left>

            <Button.Center>
              <Button.Text>
                <Text>{LOGOUT_TEXT}</Text>
              </Button.Text>
            </Button.Center>
          </Button>

          <Separator />

          <Button onPress={Actions.settingsOverviewTab}>
            <Button.Left>
              <Image style={styles.iconImage} source={settings} />
            </Button.Left>

            <Button.Center>
              <Button.Text>
                <Text>{SETTINGS_TEXT}</Text>
              </Button.Text>
            </Button.Center>
          </Button>
        </View>
      </View>
    )
  }
}
