import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { lstrings } from '../../../locales/strings'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { BUNDLED_TXS_AMOUNT_ALERT, findWalletByFioAddress } from '../../../util/FioAddressUtils'
import { AlertCardUi4 } from '../../cards/AlertCard'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ConnectWallets } from '../../FioAddress/ConnectWallets'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { SettingsHeaderRow } from '../../settings/SettingsHeaderRow'
import { SettingsTappableRow } from '../../settings/SettingsTappableRow'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

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
      Airship.show<'ok' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.fio_address_details_screen_alert_title}
          message={lstrings.fio_address_details_screen_alert_message}
          buttons={{
            ok: { label: lstrings.fio_address_details_screen_alert_button }
          }}
        />
      )).catch(() => {})
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
        walletId: fioWallet.id,
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
      route: {
        params: { bundledTxs }
      }
    } = this.props

    if (bundledTxs < BUNDLED_TXS_AMOUNT_ALERT) {
      const title = !bundledTxs ? lstrings.title_no_bundled_txs : lstrings.title_low_on_bundled_txs
      const msg = !bundledTxs ? lstrings.fio_address_details_no_bundled_txs : lstrings.fio_address_details_bundled_txs_out_soon
      return <AlertCardUi4 title={title} body={msg} type="warning" onPress={this._onPressAccountSettings} />
    }

    return (
      <EdgeCard paddingRem={0.25}>
        <SettingsTappableRow action="setting" label={lstrings.fio_address_details_screen_manage_account_settings} onPress={this._onPressAccountSettings} />
      </EdgeCard>
    )
  }

  render() {
    const { navigation, theme, route } = this.props
    const { fioAddressName, bundledTxs } = route.params
    const styles = getStyles(theme)
    const bundledTxsLabel = `${lstrings.fio_address_details_screen_bundled_txs}: ${bundledTxs}`

    return (
      <SceneWrapper>
        <SceneHeader title={fioAddressName} underline withTopMargin />
        <View style={styles.container}>
          <EdgeText style={styles.bundledTxs}>{bundledTxsLabel}</EdgeText>
          {this.renderAccountSettings()}
          <SettingsHeaderRow
            icon={<IonIcon name="link" color={theme.primaryText} size={theme.rem(1.5)} />}
            label={lstrings.fio_address_details_connect_to_wallets}
          />
          <ConnectWallets fioAddressName={fioAddressName} fioWallet={this.state.fioWallet} navigation={navigation} disabled={this.state.fioWalletLoading} />
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexGrow: 1,
    paddingHorizontal: theme.rem(0.5)
  },
  text: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  bundledTxs: {
    fontSize: theme.rem(1),
    color: theme.primaryText,
    margin: theme.rem(0.5)
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
