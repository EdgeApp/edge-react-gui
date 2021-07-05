// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Actions } from 'react-native-router-flux'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import { FIO_ADDRESS_LIST, SEND } from '../../constants/SceneKeys.js'
import { FIO_ADDRESS_DELIMITER } from '../../constants/WalletAndCurrencyConstants.js'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings'
import { FioActionSubmit } from '../../modules/FioAddress/components/FioActionSubmit'
import { getDomainSetVisibilityFee, getRenewalFee, getTransferFee, renewFioName, setDomainVisibility } from '../../modules/FioAddress/util'
import { connect } from '../../types/reactRedux.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ClickableText, PrimaryButton } from '../themed/ThemedButtons'
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

type NavigationProps = {
  fioWallet: EdgeCurrencyWallet,
  fioDomainName: string,
  isPublic: boolean,
  expiration: string,
  showRenew?: boolean
}

type Props = NavigationProps & StateProps & ThemeProps & DispatchProps

export class FioDomainSettingsComponent extends React.Component<Props, State> {
  state: State = {
    showRenew: false,
    showVisibility: false,
    showTransfer: false
  }

  componentDidMount() {
    const { showRenew } = this.props
    if (showRenew) {
      this.setState({ showRenew: true })
    }
  }

  afterSuccess = () => {
    this.props.refreshAllFioAddresses()
    Actions.pop()
  }

  afterTransferSuccess = async () => {
    const { theme } = this.props
    const styles = getStyles(theme)
    const domainName = `@${this.props.fioDomainName || ''}`
    const transferredMessage = ` ${s.strings.fio_domain_transferred.toLowerCase()}`
    await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.fio_domain_label}
        buttons={{
          ok: { label: s.strings.string_ok_cap }
        }}
      >
        <EdgeText style={styles.tileTextBottom}>
          <EdgeText style={styles.cursive}>{domainName}</EdgeText>
          {transferredMessage}
        </EdgeText>
      </ButtonsModal>
    ))
    return Actions.popTo(FIO_ADDRESS_LIST)
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

  getRenewalFee = async (fioWallet: EdgeCurrencyWallet) => getRenewalFee(fioWallet, true)

  getTransferFee = async (fioWallet: EdgeCurrencyWallet) => getTransferFee(fioWallet, true)

  setDomainVisibility = async (fioWallet: EdgeCurrencyWallet, fee: number) => {
    const { fioDomainName, isPublic, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    await setDomainVisibility(fioWallet, fioDomainName, !isPublic, fee)
  }

  renewDomain = async (fioWallet: EdgeCurrencyWallet, renewalFee: number) => {
    const { fioDomainName, isConnected } = this.props
    if (!isConnected) {
      throw new Error(s.strings.fio_network_alert_text)
    }

    await renewFioName(fioWallet, fioDomainName, renewalFee, true)
  }

  goToTransfer = (params: { fee: number }) => {
    const { fee: transferFee } = params
    if (!transferFee) return showError(s.strings.fio_get_fee_err_msg)
    this.cancelOperation()

    const guiMakeSpendInfo = {
      nativeAmount: `${transferFee}`,
      currencyCode: this.props.fioWallet.currencyInfo.currencyCode,
      otherParams: {
        fioAction: 'transferFioDomain',
        fioParams: { fioDomain: this.props.fioDomainName, newOwnerKey: '', maxFee: transferFee }
      },
      onDone: (err, edgeTransaction) => {
        if (!err) {
          this.afterTransferSuccess()
        }
      }
    }

    Actions.push(SEND, {
      guiMakeSpendInfo,
      selectedWalletId: this.props.fioWallet.id,
      selectedCurrencyCode: this.props.fioWallet.currencyInfo.currencyCode,
      lockTilesMap: {
        wallet: true
      },
      hiddenTilesMap: {
        amount: true,
        fioAddressSelect: true
      },
      infoTiles: [{ label: s.strings.fio_domain_to_transfer, value: `@${this.props.fioDomainName}` }]
    })
  }

  render() {
    const { fioWallet, fioDomainName, expiration, isPublic, theme } = this.props
    const { showRenew, showVisibility, showTransfer } = this.state
    const styles = getStyles(theme)

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
            title={s.strings.title_fio_renew_domain}
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
            <PrimaryButton label={s.strings.title_fio_renew_domain} onPress={this.onRenewPress} marginRem={[1.5, 1, 0.25]} />
            <PrimaryButton label={s.strings.title_fio_transfer_domain} onPress={this.onTransferPress} marginRem={[0.25, 1]} />
            <ClickableText onPress={this.onVisibilityPress} marginRem={[0.25, 1]}>
              <EdgeText style={styles.visibilityText}>{isPublic ? s.strings.title_fio_make_private_domain : s.strings.title_fio_make_public_domain}</EdgeText>
            </ClickableText>
          </>
        )}
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  visibilityText: {
    color: theme.textLink,
    textAlign: 'center'
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

export const FioDomainSettingsScene = connect<StateProps, DispatchProps, NavigationProps>(
  state => ({
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(FioDomainSettingsComponent))
