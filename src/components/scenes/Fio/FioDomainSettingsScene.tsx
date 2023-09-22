import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { refreshAllFioAddresses } from '../../../actions/FioAddressActions'
import { FIO_ADDRESS_DELIMITER } from '../../../constants/WalletAndCurrencyConstants'
import { formatDate } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { GuiMakeSpendInfo } from '../../../types/types'
import { getDomainSetVisibilityFee, getRenewalFee, getTransferFee, renewFioDomain, setDomainVisibility } from '../../../util/FioAddressUtils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { FioActionSubmit } from '../../FioAddress/FioActionSubmit'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { ClickableText } from '../../themed/ClickableText'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { Tile } from '../../tiles/Tile'

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
}
interface OwnProps extends EdgeSceneProps<'fioDomainSettings'> {}

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
    const { isConnected, route } = this.props
    const { fioDomainName } = route.params

    if (!isConnected) {
      throw new Error(lstrings.fio_network_alert_text)
    }

    await renewFioDomain(fioWallet, fioDomainName, renewalFee)
  }

  goToTransfer = (params: { fee: number }) => {
    const { navigation } = this.props
    const { fee: transferFee } = params
    if (!transferFee) return showError(lstrings.fio_get_fee_err_msg)
    this.cancelOperation()
    const { route } = this.props
    const { fioDomainName, fioWallet } = route.params

    const guiMakeSpendInfo: GuiMakeSpendInfo = {
      nativeAmount: '',
      currencyCode: fioWallet.currencyInfo.currencyCode,
      otherParams: {
        action: {
          name: 'transferFioDomain',
          params: { fioDomain: fioDomainName, maxFee: transferFee }
        }
      },
      onDone: err => {
        if (!err) {
          this.afterTransferSuccess().catch(err => showError(err))
        }
      }
    }

    navigation.navigate('send', {
      guiMakeSpendInfo,
      selectedWalletId: fioWallet.id,
      selectedCurrencyCode: fioWallet.currencyInfo.currencyCode,
      lockTilesMap: {
        wallet: true
      },
      hiddenFeaturesMap: {
        amount: true,
        fioAddressSelect: true
      },
      infoTiles: [{ label: lstrings.fio_domain_to_transfer, value: `@${fioDomainName}` }]
    })
  }

  render() {
    const { route } = this.props
    const { fioWallet, fioDomainName, expiration, isPublic } = route.params

    const { showRenew, showVisibility, showTransfer } = this.state

    return (
      <SceneWrapper background="theme">
        <Tile type="static" title={lstrings.fio_domain_label} body={`${FIO_ADDRESS_DELIMITER} ${fioDomainName}`} />
        <Tile type="static" title={lstrings.fio_address_details_screen_expires} body={formatDate(new Date(expiration))} />
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
          <>
            <MainButton label={lstrings.title_fio_renew_domain} onPress={this.onRenewPress} marginRem={[1.5, 1, 0.25]} />
            <MainButton label={lstrings.title_fio_transfer_domain} onPress={this.onTransferPress} marginRem={[0.25, 1]} />
            <ClickableText
              onPress={this.onVisibilityPress}
              paddingRem={[0.25, 1]}
              label={isPublic ? lstrings.title_fio_make_private_domain : lstrings.title_fio_make_public_domain}
            />
          </>
        )}
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
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

export const FioDomainSettingsScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    async refreshAllFioAddresses() {
      await dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(FioDomainSettingsComponent))
