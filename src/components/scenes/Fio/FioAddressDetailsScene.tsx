import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { lstrings } from '../../../locales/strings'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { BUNDLED_TXS_AMOUNT_ALERT, findWalletByFioAddress } from '../../../util/FioAddressUtils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ConnectWalletsConnector as ConnectWallets } from '../../FioAddress/ConnectWallets'
import { showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { SettingsHeaderRow } from '../../settings/SettingsHeaderRow'
import { SettingsTappableRow } from '../../settings/SettingsTappableRow'
import { EdgeText } from '../../themed/EdgeText'

interface StateProps {
  fioWallets: EdgeCurrencyWallet[]
}

interface OwnProps extends EdgeSceneProps<'fioAddressDetails'> {}

interface LocalState {
  fioWalletLoading: boolean
  fioWallet: EdgeCurrencyWallet | null
}

type Props = StateProps & ThemeProps & OwnProps

export class FioAddressDetails extends React.Component<Props, LocalState> {
  state: LocalState = {
    fioWalletLoading: false,
    fioWallet: null
  }

  componentDidMount() {
    const { route } = this.props
    const { fioAddressName } = route.params
    if (!fioAddressName) {
      Alert.alert(lstrings.fio_address_details_screen_alert_title, lstrings.fio_address_details_screen_alert_message, [
        { text: lstrings.fio_address_details_screen_alert_button }
      ])
    }
    this.findFioWallet().catch(err => showError(err))
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
    const { fioAddressName, bundledTxs } = route.params
    const { fioWallet } = this.state
    if (fioWallet) {
      navigation.navigate('fioAddressSettings', {
        fioWallet,
        fioAddressName,
        bundledTxs,
        refreshAfterAddBundledTxs: true
      })
    } else {
      showError(lstrings.fio_wallet_missing_for_fio_address)
    }
  }

  renderAccountSettings = () => {
    const {
      theme,
      route: {
        params: { bundledTxs }
      }
    } = this.props
    const styles = getStyles(theme)

    if (bundledTxs < BUNDLED_TXS_AMOUNT_ALERT) {
      return (
        <SettingsTappableRow onPress={this._onPressAccountSettings}>
          <IonIcon name="ios-warning" color={theme.warningIcon} style={styles.settingsIcon} />
          <EdgeText style={styles.settingsWarning} numberOfLines={4}>
            {!bundledTxs ? lstrings.fio_address_details_no_bundled_txs : lstrings.fio_address_details_bundled_txs_out_soon}
          </EdgeText>
        </SettingsTappableRow>
      )
    }

    return (
      <SettingsTappableRow label={lstrings.fio_address_details_screen_manage_account_settings} onPress={this._onPressAccountSettings}>
        <IonIcon name="ios-settings" color={theme.icon} style={styles.settingsIcon} />
      </SettingsTappableRow>
    )
  }

  render() {
    const { navigation, theme, route } = this.props
    const { fioAddressName, bundledTxs } = route.params
    const styles = getStyles(theme)
    const bundledTxsLabel = `${lstrings.fio_address_details_screen_bundled_txs}: ${bundledTxs}`

    return (
      <SceneWrapper background="theme">
        <EdgeText style={styles.bundledTxs}>{bundledTxsLabel}</EdgeText>
        {this.renderAccountSettings()}
        <SettingsHeaderRow
          icon={<IonIcon name="ios-link" color={theme.primaryText} size={theme.rem(1.5)} />}
          label={lstrings.fio_address_details_connect_to_wallets}
        />
        <ConnectWallets fioAddressName={fioAddressName} fioWallet={this.state.fioWallet} navigation={navigation} disabled={this.state.fioWalletLoading} />
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  text: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  bundledTxs: {
    fontSize: theme.rem(0.75),
    color: theme.primaryText,
    textAlign: 'center',
    marginTop: theme.rem(-0.5),
    paddingBottom: theme.rem(0.75)
  },
  settingsIcon: {
    fontSize: theme.rem(1.5),
    paddingHorizontal: theme.rem(0.5)
  },
  settingsWarning: {
    fontSize: theme.rem(0.75),
    color: theme.warningText,
    paddingLeft: theme.rem(0.5),
    width: '75%'
  }
}))

export const FioAddressDetailsScene = connect<StateProps, {}, OwnProps>(
  state => ({
    fioWallets: state.ui.wallets.fioWallets
  }),
  dispatch => ({})
)(withTheme(FioAddressDetails))
