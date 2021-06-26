// @flow

import * as React from 'react'
import { Image, Platform, ScrollView, Text, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import Share from 'react-native-share'
import { sprintf } from 'sprintf-js'

import fioAddressIcon from '../../../../../assets/images/sidenav/fioaddress.png'
import fioRequestsIcon from '../../../../../assets/images/sidenav/fiorequests.png'
import logoutImage from '../../../../../assets/images/sidenav/logout.png'
import scanIcon from '../../../../../assets/images/sidenav/scan.png'
import settings from '../../../../../assets/images/sidenav/settings.png'
import shareIcon from '../../../../../assets/images/sidenav/share.png'
import sweepIcon from '../../../../../assets/images/sidenav/sweep.png'
import termsIcon from '../../../../../assets/images/sidenav/terms.png'
import { type WalletListResult, WalletListModal } from '../../../../../components/modals/WalletListModal.js'
import { SWEEP_PRIVATE_KEY } from '../../../../../components/scenes/ScanScene'
import { Airship } from '../../../../../components/services/AirshipInstance.js'
import * as Constants from '../../../../../constants/indexConstants.js'
import { getPrivateKeySweepableCurrencies } from '../../../../../constants/WalletAndCurrencyConstants.js'
import s from '../../../../../locales/strings.js'
import { THEME } from '../../../../../theme/variables/airbitz.js'
import { scale } from '../../../../../util/scaling.js'
import styles from '../style'
import { Button } from './Button/Button.ui.js'
import { Separator } from './Separator/Separator.ui.js'
import UserList from './UserListConnector'

export type Props = {
  logout: (username?: string) => void,
  usersView: boolean,
  onSelectWallet: (walletId: string, currencyCode: string) => void
}
export default class Main extends React.Component<Props> {
  render() {
    const { onSelectWallet, usersView } = this.props

    return usersView ? (
      <UserList />
    ) : (
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <ScrollView>
          <View>
            <View>
              <FioAddressButton />
              <FioRequestsButton />
              <ScanButton />
              <SweepPrivateKeyButton onSelectWallet={onSelectWallet} />
              <TermsOfServiceButton />
              <ShareButton />
            </View>
          </View>
          <LogoutButton onPress={this.handleLogout} />
          <SettingsButton />
        </ScrollView>
      </View>
    )
  }

  handleLogout = () => {
    this.props.logout()
  }
}

const goToScene = (scene: string, sceneProps?: any) => {
  const { currentScene, drawerClose } = Actions

  if (currentScene !== scene) {
    Actions.jump(scene, sceneProps)
  } else if (sceneProps) {
    Actions.refresh(sceneProps)
  }

  drawerClose()
}

const popToSendScan = () => goToScene(Constants.SCAN, { data: '' })
const ScanButton = () => {
  return (
    <Button onPress={popToSendScan}>
      <Button.Row>
        <Button.Left>
          <Image source={scanIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{s.strings.drawer_scan_qr_send}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

type SweepPrivateKeyButtonProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

const SweepPrivateKeyButton = (props: SweepPrivateKeyButtonProps) => {
  const { onSelectWallet } = props

  const handlePress = () => {
    Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={getPrivateKeySweepableCurrencies()} showCreateWallet />
    )).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        onSelectWallet(walletId, currencyCode)
        Actions.jump(Constants.SCAN, { data: SWEEP_PRIVATE_KEY })
      }
    })
  }

  return (
    <Button onPress={handlePress}>
      <Button.Row>
        <Button.Left>
          <Image source={sweepIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{s.strings.drawer_sweep_private_key}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const popToTermsOfServiceScene = () => goToScene(Constants.TERMS_OF_SERVICE)
const TermsOfServiceButton = () => {
  return (
    <Button onPress={popToTermsOfServiceScene}>
      <Button.Row>
        <Button.Left>
          <Image source={termsIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{s.strings.title_terms_of_service}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const shareApp = () => {
  const url = THEME.websiteUrl
  const message = `${sprintf(s.strings.share_subject, s.strings.app_name)}\n\n${s.strings.share_message}\n\n`
  const shareOptions = {
    message: Platform.OS === 'ios' ? message : message + url,
    url: Platform.OS === 'ios' ? url : ''
  }
  Share.open(shareOptions).catch(e => console.log(e))
}
const ShareButton = () => {
  return (
    <Button onPress={shareApp}>
      <Button.Row>
        <Button.Left>
          <Image source={shareIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{s.strings.string_share + ' ' + s.strings.app_name}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const popToSettingsScene = () => goToScene(Constants.SETTINGS_OVERVIEW_TAB)
const SettingsButton = () => {
  return (
    <Button onPress={popToSettingsScene}>
      <Button.Row>
        <Button.Left>
          <Image style={[styles.iconImage, { height: scale(20), width: scale(20) }]} source={settings} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{s.strings.settings_title}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

type LogoutButtonProps = {
  onPress: () => void
}

const LogoutButton = (props: LogoutButtonProps) => {
  const { onPress } = props
  return (
    <Button onPress={onPress}>
      <Button.Row>
        <Button.Left>
          <Image style={[styles.iconImage, { height: scale(20), width: scale(20) }]} source={logoutImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{s.strings.settings_button_logout}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const goToFioNamesScene = () => goToScene(Constants.FIO_ADDRESS_LIST)
const FioAddressButton = () => {
  // FIO disable changes below
  if (global.isFioDisabled) return null
  return (
    <Button onPress={goToFioNamesScene}>
      <Button.Row>
        <Button.Left>
          <Image source={fioAddressIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{s.strings.drawer_fio_names}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}

const goToFioRequestsScene = () => goToScene(Constants.FIO_REQUEST_LIST)
const FioRequestsButton = () => {
  return (
    <Button onPress={goToFioRequestsScene}>
      <Button.Row>
        <Button.Left>
          <Image source={fioRequestsIcon} style={styles.iconImage} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <Text>{s.strings.drawer_fio_requests}</Text>
          </Button.Text>
        </Button.Center>
      </Button.Row>
    </Button>
  )
}
