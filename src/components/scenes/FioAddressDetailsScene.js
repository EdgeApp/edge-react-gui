// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Alert, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { FIO_ADDRESS_SETTINGS } from '../../constants/SceneKeys.js'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { ConnectWalletsConnector as ConnectWallets } from '../../modules/FioAddress/components/ConnectWallets'
import { expiredSoon, findWalletByFioAddress } from '../../modules/FioAddress/util'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, Actions } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow'
import { SettingsRow } from '../themed/SettingsRow.js'

type StateProps = {
  fioWallets: EdgeCurrencyWallet[]
}

type NavProps = {
  fioAddressName: string,
  expiration: string,
  navigation: NavigationProp<'fioAddressDetails'>
}

type LocalState = {
  fioWalletLoading: boolean,
  fioWallet: EdgeCurrencyWallet | null
}

type Props = StateProps & NavProps & ThemeProps

class FioAddressDetails extends React.Component<Props, LocalState> {
  state: LocalState = {
    fioWalletLoading: false,
    fioWallet: null
  }

  componentDidMount() {
    const { fioAddressName } = this.props
    if (!fioAddressName) {
      Alert.alert(s.strings.fio_address_details_screen_alert_title, s.strings.fio_address_details_screen_alert_message, [
        { text: s.strings.fio_address_details_screen_alert_button }
      ])
    }
    this.props.navigation.setParams({
      renderTitle: this.renderTitle(fioAddressName)
    })
    this.findFioWallet()
  }

  findFioWallet = async () => {
    const { fioAddressName, fioWallets } = this.props
    this.setState({ fioWalletLoading: true })
    const fioWallet = await findWalletByFioAddress(fioWallets, fioAddressName)
    this.setState({ fioWalletLoading: false, fioWallet })
  }

  _onPressAccountSettings = (): void => {
    const { fioAddressName, expiration } = this.props
    const { fioWallet } = this.state
    if (fioWallet) {
      Actions.push(FIO_ADDRESS_SETTINGS, {
        fioWallet,
        fioAddressName,
        expiration,
        refreshAfterRenew: true
      })
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
  }

  checkExpiredSoon = (): boolean => expiredSoon(this.props.expiration)

  renderTitle = (title: string) => {
    const styles = getStyles(this.props.theme)
    return (
      <View style={styles.titleWrapper}>
        <EdgeText style={styles.titleStyle}>{title}</EdgeText>
      </View>
    )
  }

  renderAccountSettings = () => {
    const { theme } = this.props
    const styles = getStyles(theme)
    let icon, displayName
    if (this.checkExpiredSoon()) {
      icon = <IonIcon name="ios-warning" color={theme.warningIcon} size={theme.rem(1.5)} />
      displayName = <EdgeText style={styles.warning}>{s.strings.fio_address_details_expired_soon}</EdgeText>
    } else {
      icon = <IonIcon name="ios-settings" color={theme.icon} size={theme.rem(1.5)} />
      displayName = <EdgeText style={styles.settingsText}>{s.strings.fio_address_details_screen_manage_account_settings}</EdgeText>
    }

    return (
      <SettingsRow
        icon={icon}
        text={displayName}
        onPress={this._onPressAccountSettings}
        right={<AntDesignIcon name="right" color={theme.icon} size={theme.rem(1)} />}
      />
    )
  }

  render() {
    const { fioAddressName, expiration, theme } = this.props
    const styles = getStyles(theme)
    const expirationLabel = `${s.strings.fio_address_details_screen_expires} ${formatDate(new Date(expiration))}`

    return (
      <SceneWrapper background="header">
        <EdgeText style={styles.expiration}>{expirationLabel}</EdgeText>
        {this.renderAccountSettings()}
        <SettingsHeaderRow
          icon={<IonIcon name="ios-link" color={theme.primaryText} size={theme.rem(1.5)} />}
          numberOfLines={2}
          text={s.strings.fio_address_details_connect_to_wallets}
        />
        <ConnectWallets fioAddressName={fioAddressName} fioWallet={this.state.fioWallet} disabled={this.state.fioWalletLoading} />
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  text: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  titleStyle: {
    alignSelf: 'center',
    fontSize: 20,
    color: theme.primaryText
  },
  expiration: {
    fontSize: theme.rem(0.75),
    color: theme.primaryText,
    textAlign: 'center',
    marginTop: theme.rem(-0.5),
    paddingBottom: theme.rem(0.75)
  },
  titleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  settingsText: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  settingsTile: {
    paddingHorizontal: theme.rem(1)
  },
  settingsTitle: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  warning: {
    fontSize: theme.rem(1),
    color: theme.warningText
  }
}))

export const FioAddressDetailsScene = connect<StateProps, {}, NavProps>(
  state => ({
    fioWallets: state.ui.wallets.fioWallets
  }),
  dispatch => ({})
)(withTheme(FioAddressDetails))
