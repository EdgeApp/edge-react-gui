// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import { FIO_ADDRESS_DELIMITER } from '../../constants/WalletAndCurrencyConstants.js'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings'
import { FioActionSubmit } from '../../modules/FioAddress/components/FioActionSubmit'
import { getDomainSetVisibilityFee, getRenewalFee, getTransferFee, renewFioDomain, setDomainVisibility } from '../../modules/FioAddress/util'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { ClickableText } from '../themed/ClickableText.js'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton.js'
import { Tile } from '../themed/Tile'

type State = {
  showRenew: boolean,
  showVisibility: boolean,
  showTransfer: boolean
}

type StateProps = {
  isConnected: boolean
}

type DispatchProps = {
  refreshAllFioAddresses: () => void
}
type OwnProps = {
  navigation: NavigationProp<'fioDomainSettings'>,
  route: RouteProp<'fioDomainSettings'>
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

  afterSuccess = () => {
    const { navigation } = this.props
    this.props.refreshAllFioAddresses()
    navigation.goBack()
  }

  afterTransferSuccess = async () => {
    const { theme, navigation, route } = this.props
    const { fioDomainName } = route.params
    const styles = getStyles(theme)
    const domainName = `@${fioDomainName || ''}`
    const transferredMessage = ` ${s.strings.fio_domain_transferred.toLowerCase()}`
    await Airship.show(bridge => (
      <ButtonsModal bridge={bridge} title={s.strings.fio_domain_label} buttons={{ ok: { label: s.strings.string_ok_cap } }}>
        <EdgeText style={styles.tileTextBottom}>
          <EdgeText style={styles.cursive}>{domainName}</EdgeText>
          {transferredMessage}
        </EdgeText>
      </ButtonsModal>
    ))
    return navigation.navigate('fioAddressList')
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

  getRenewalFee = async (fioWallet: EdgeCurrencyWallet) => getRenewalFee(fioWallet)

  getTransferFee = async (fioWallet: EdgeCurrencyWallet) => getTransferFee(fioWallet, true)

  setDomainVisibility = async (fioWallet: EdgeCurrencyWallet, fee: number) => {
    const { isConnected, route } = this.props
    const { fioDomainName, isPublic } = route.params

    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    await setDomainVisibility(fioWallet, fioDomainName, !isPublic, fee)
  }

  renewDomain = async (fioWallet: EdgeCurrencyWallet, renewalFee: number) => {
    const { isConnected, route } = this.props
    const { fioDomainName } = route.params

    if (!isConnected) {
      throw new Error(s.strings.fio_network_alert_text)
    }

    await renewFioDomain(fioWallet, fioDomainName, renewalFee)
  }

  goToTransfer = (params: { fee: number }) => {
    const { navigation } = this.props
    const { fee: transferFee } = params
    if (!transferFee) return showError(s.strings.fio_get_fee_err_msg)
    this.cancelOperation()
    const { route } = this.props
    const { fioDomainName, fioWallet } = route.params

    const guiMakeSpendInfo = {
      nativeAmount: '',
      currencyCode: fioWallet.currencyInfo.currencyCode,
      otherParams: {
        action: {
          name: 'transferFioDomain',
          params: { fioDomain: fioDomainName, maxFee: transferFee }
        }
      },
      onDone: (err, edgeTransaction) => {
        if (!err) {
          this.afterTransferSuccess()
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
      hiddenTilesMap: {
        amount: true,
        fioAddressSelect: true
      },
      infoTiles: [{ label: s.strings.fio_domain_to_transfer, value: `@${fioDomainName}` }]
    })
  }

  render() {
    const { route } = this.props
    const { fioWallet, fioDomainName, expiration, isPublic } = route.params

    const { showRenew, showVisibility, showTransfer } = this.state

    return (
      <SceneWrapper background="header">
        <Tile type="static" title={s.strings.fio_domain_label} body={`${FIO_ADDRESS_DELIMITER} ${fioDomainName}`} />
        <Tile type="static" title={s.strings.fio_address_details_screen_expires} body={formatDate(new Date(expiration))} />
        {showVisibility && (
          <FioActionSubmit
            title={isPublic ? s.strings.title_fio_make_private_domain : s.strings.title_fio_make_public_domain}
            onSubmit={this.setDomainVisibility}
            onSuccess={this.afterSuccess}
            cancelOperation={this.cancelOperation}
            getOperationFee={getDomainSetVisibilityFee}
            successMessage={isPublic ? s.strings.fio_domain_is_private_label : s.strings.fio_domain_is_public_label}
            fioWallet={fioWallet}
            showPaymentWalletPicker
          />
        )}
        {showRenew && (
          <FioActionSubmit
            onSubmit={this.renewDomain}
            onSuccess={this.afterSuccess}
            cancelOperation={this.cancelOperation}
            getOperationFee={this.getRenewalFee}
            successMessage={s.strings.fio_request_renew_domain_ok_text}
            fioWallet={fioWallet}
            showPaymentWalletPicker
          />
        )}
        {showTransfer && <FioActionSubmit goTo={this.goToTransfer} getOperationFee={this.getTransferFee} fioWallet={fioWallet} />}
        {!showRenew && !showVisibility && !showTransfer && (
          <>
            <MainButton label={s.strings.title_fio_renew_domain} onPress={this.onRenewPress} marginRem={[1.5, 1, 0.25]} />
            <MainButton label={s.strings.title_fio_transfer_domain} onPress={this.onTransferPress} marginRem={[0.25, 1]} />
            <ClickableText
              onPress={this.onVisibilityPress}
              paddingRem={[0.25, 1]}
              label={isPublic ? s.strings.title_fio_make_private_domain : s.strings.title_fio_make_public_domain}
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
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(FioDomainSettingsComponent))
