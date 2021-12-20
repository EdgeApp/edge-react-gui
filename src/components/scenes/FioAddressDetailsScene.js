// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import s from '../../locales/strings.js'
import { ConnectWalletsConnector as ConnectWallets } from '../../modules/FioAddress/components/ConnectWallets'
import { findWalletByFioAddress } from '../../modules/FioAddress/util'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow'
import { SettingsTappableRow } from '../themed/SettingsTappableRow.js'

type StateProps = {
  fioWallets: EdgeCurrencyWallet[]
}

type OwnProps = {
  navigation: NavigationProp<'fioAddressDetails'>,
  route: RouteProp<'fioAddressDetails'>
}

type LocalState = {
  fioWalletLoading: boolean,
  fioWallet: EdgeCurrencyWallet | null
}

type Props = StateProps & ThemeProps & OwnProps

class FioAddressDetails extends React.Component<Props, LocalState> {
  state: LocalState = {
    fioWalletLoading: false,
    fioWallet: null
  }

  componentDidMount() {
    const { route } = this.props
    const { fioAddressName } = route.params
    if (!fioAddressName) {
      Alert.alert(s.strings.fio_address_details_screen_alert_title, s.strings.fio_address_details_screen_alert_message, [
        { text: s.strings.fio_address_details_screen_alert_button }
      ])
    }
    this.findFioWallet()
  }

  findFioWallet = async () => {
    const { fioWallets, route } = this.props
    const { fioAddressName } = route.params

    this.setState({ fioWalletLoading: true })
    const fioWallet = await findWalletByFioAddress(fioWallets, fioAddressName)
    this.setState({ fioWalletLoading: false, fioWallet })
  }

  _onPressAccountSettings = (): void => {
    const { navigation, route } = this.props
    const { fioAddressName } = route.params
    const { fioWallet } = this.state
    if (fioWallet) {
      navigation.navigate('fioAddressSettings', {
        fioWallet,
        fioAddressName,
        refreshAfterRenew: true
      })
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
  }

  renderAccountSettings = () => {
    const { theme } = this.props
    const styles = getStyles(theme)

    return (
      <SettingsTappableRow label={s.strings.fio_address_details_screen_manage_account_settings} onPress={this._onPressAccountSettings}>
        <IonIcon name="ios-settings" color={theme.icon} style={styles.settingsIcon} />
      </SettingsTappableRow>
    )
  }

  render() {
    const { theme, route } = this.props
    const { fioAddressName } = route.params

    return (
      <SceneWrapper background="header">
        {this.renderAccountSettings()}
        <SettingsHeaderRow
          icon={<IonIcon name="ios-link" color={theme.primaryText} size={theme.rem(1.5)} />}
          label={s.strings.fio_address_details_connect_to_wallets}
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
  settingsIcon: {
    fontSize: theme.rem(1.5),
    paddingHorizontal: theme.rem(0.5)
  },
  settingsWarning: {
    fontSize: theme.rem(1),
    color: theme.warningText,
    paddingHorizontal: theme.rem(0.5)
  }
}))

export const FioAddressDetailsScene = connect<StateProps, {}, OwnProps>(
  state => ({
    fioWallets: state.ui.wallets.fioWallets
  }),
  dispatch => ({})
)(withTheme(FioAddressDetails))
