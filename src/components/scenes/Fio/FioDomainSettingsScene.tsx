import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { refreshAllFioAddresses } from '../../../actions/FioAddressActions'
import { FIO_ADDRESS_DELIMITER } from '../../../constants/WalletAndCurrencyConstants'
import { formatDate } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { getDomainSetVisibilityFee, getRenewalFee, getTransferFee, renewFioDomain, setDomainVisibility } from '../../../util/FioAddressUtils'
import { logEvent, TrackingEventName, TrackingValues } from '../../../util/tracking'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { FioActionSubmit } from '../../FioAddress/FioActionSubmit'
import { withWallet } from '../../hoc/withWallet'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { EdgeRow } from '../../rows/EdgeRow'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { SettingsTappableRow } from '../../settings/SettingsTappableRow'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { SendScene2Params } from '../SendScene2'

export interface FioDomainSettingsParams {
  expiration: string
  fioDomainName: string
  isPublic: boolean
  walletId: string
  showRenew?: boolean
}

interface State {
  showRenew: boolean
  showVisibility: boolean
  showTransfer: boolean
}

interface StateProps {
  isConnected: boolean
}

interface DispatchProps {
  refreshAllFioAddresses: () => Promise<void>
  onLogEvent: (event: TrackingEventName, values: TrackingValues) => void
}
interface OwnProps extends EdgeSceneProps<'fioDomainSettings'> {
  wallet: EdgeCurrencyWallet
}

type Props = StateProps & ThemeProps & DispatchProps & OwnProps

export class FioDomainSettingsComponent extends React.Component<Props, State> {
  state: State = {
    showRenew: false,
    showVisibility: false,
    showTransfer: false
  }

  componentDidMount() {
    const { showRenew } = this.props.route.params
    if (showRenew) {
      this.setState({ showRenew: true })
    }
  }

  afterSuccess = async () => {
    const { navigation } = this.props
    await this.props.refreshAllFioAddresses()
    navigation.goBack()
  }

  afterTransferSuccess = async () => {
    const { theme, navigation, route } = this.props
    const { fioDomainName } = route.params
    const styles = getStyles(theme)
    const domainName = `@${fioDomainName || ''}`
    const transferredMessage = ` ${lstrings.fio_domain_transferred.toLowerCase()}`
    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal bridge={bridge} title={lstrings.fio_domain_label} buttons={{ ok: { label: lstrings.string_ok_cap } }}>
        <EdgeText style={styles.tileTextBottom}>
          <EdgeText style={styles.cursive}>{domainName}</EdgeText>
          {transferredMessage}
        </EdgeText>
      </ButtonsModal>
    ))
    return navigation.navigate('fioAddressList', {})
  }

  onVisibilityPress = () => {
    this.setState({ showVisibility: true })
  }

  onRenewPress = () => {
    this.setState({ showRenew: true })
  }

  onTransferPress = () => {
    this.setState({ showTransfer: true })
  }

  cancelOperation = () => {
    this.setState({ showRenew: false, showVisibility: false, showTransfer: false })
  }

  getRenewalFee = async (fioWallet: EdgeCurrencyWallet) => await getRenewalFee(fioWallet)

  getTransferFee = async (fioWallet: EdgeCurrencyWallet) => await getTransferFee(fioWallet, true)

  setDomainVisibility = async (fioWallet: EdgeCurrencyWallet, fee: number) => {
    const { isConnected, route } = this.props
    const { fioDomainName, isPublic } = route.params

    if (!isConnected) {
      showError(lstrings.fio_network_alert_text)
      return
    }
    await setDomainVisibility(fioWallet, fioDomainName, !isPublic, fee)
  }

  renewDomain = async (fioWallet: EdgeCurrencyWallet, renewalFee: number) => {
    const { isConnected, route, onLogEvent } = this.props
    const { fioDomainName } = route.params

    if (!isConnected) {
      throw new Error(lstrings.fio_network_alert_text)
    }

    await renewFioDomain(fioWallet, fioDomainName, renewalFee)

    onLogEvent('Fio_Domain_Renew', {
      conversionValues: {
        conversionType: 'crypto',
        cryptoAmount: new CryptoAmount({ nativeAmount: String(renewalFee), currencyConfig: fioWallet.currencyConfig, tokenId: null })
      }
    })
  }

  goToTransfer = (params: { fee: number }) => {
    const { navigation, wallet: fioWallet } = this.props
    const { fee: transferFee } = params
    if (!transferFee) return showError(lstrings.fio_get_fee_err_msg)
    this.cancelOperation()
    const { route } = this.props
    const { fioDomainName } = route.params

    const sendParams: SendScene2Params = {
      tokenId: null,
      spendInfo: {
        tokenId: null,
        spendTargets: [{ nativeAmount: '' }],
        otherParams: {
          action: {
            name: 'transferFioDomain',
            params: { fioDomain: fioDomainName, maxFee: transferFee }
          }
        }
      },
      onDone: err => {
        if (!err) {
          this.afterTransferSuccess().catch(err => showError(err))
        }
      },
      walletId: fioWallet.id,
      lockTilesMap: {
        wallet: true
      },
      hiddenFeaturesMap: {
        amount: true,
        fioAddressSelect: true
      },
      infoTiles: [{ label: lstrings.fio_domain_to_transfer, value: `@${fioDomainName}` }]
    }

    navigation.navigate('send2', sendParams)
  }

  render() {
    const { route, theme, wallet: fioWallet } = this.props
    const { fioDomainName, expiration, isPublic } = route.params

    const { showRenew, showVisibility, showTransfer } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper scroll>
        <SceneHeader title={lstrings.title_fio_domain_settings} underline withTopMargin />
        <View style={styles.container}>
          <EdgeCard>
            <EdgeRow title={lstrings.fio_domain_label} body={`${FIO_ADDRESS_DELIMITER} ${fioDomainName}`} />
          </EdgeCard>
          <EdgeCard>
            <EdgeRow title={lstrings.fio_address_details_screen_expires} body={formatDate(new Date(expiration))} />
          </EdgeCard>
          {showVisibility && (
            <FioActionSubmit
              title={isPublic ? lstrings.title_fio_make_private_domain : lstrings.title_fio_make_public_domain}
              onSubmit={this.setDomainVisibility}
              onSuccess={this.afterSuccess}
              onCancel={this.cancelOperation}
              getOperationFee={getDomainSetVisibilityFee}
              successMessage={isPublic ? lstrings.fio_domain_is_private_label : lstrings.fio_domain_is_public_label}
              fioWallet={fioWallet}
              showPaymentWalletPicker
              navigation={this.props.navigation}
            />
          )}
          {showRenew && (
            <FioActionSubmit
              onSubmit={this.renewDomain}
              onSuccess={this.afterSuccess}
              onCancel={this.cancelOperation}
              getOperationFee={this.getRenewalFee}
              successMessage={lstrings.fio_request_renew_domain_ok_text}
              fioWallet={fioWallet}
              showPaymentWalletPicker
              navigation={this.props.navigation}
            />
          )}
          {showTransfer && (
            <FioActionSubmit goTo={this.goToTransfer} getOperationFee={this.getTransferFee} fioWallet={fioWallet} navigation={this.props.navigation} />
          )}
          {!showRenew && !showVisibility && !showTransfer && (
            <EdgeCard sections>
              <SettingsTappableRow label={lstrings.title_fio_renew_domain} onPress={this.onRenewPress} />
              <SettingsTappableRow label={lstrings.title_fio_transfer_domain} onPress={this.onTransferPress} />
              <SettingsTappableRow
                label={isPublic ? lstrings.title_fio_make_private_domain : lstrings.title_fio_make_public_domain}
                onPress={this.onVisibilityPress}
              />
            </EdgeCard>
          )}
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    marginTop: theme.rem(0.5),
    paddingHorizontal: theme.rem(0.5)
  },
  spacer: {
    paddingTop: theme.rem(1.25)
  },
  tileTextBottom: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  cursive: {
    color: theme.primaryText,
    fontStyle: 'italic'
  }
}))

const FioDomainSettingsConnected = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    async refreshAllFioAddresses() {
      await dispatch(refreshAllFioAddresses())
    },
    onLogEvent(event: TrackingEventName, values: TrackingValues) {
      dispatch(logEvent(event, values))
    }
  })
)(withTheme(FioDomainSettingsComponent))

export const FioDomainSettingsScene = withWallet(FioDomainSettingsConnected)
