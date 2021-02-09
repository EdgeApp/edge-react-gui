// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import * as Constants from '../../constants/indexConstants'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings'
import { refreshAllFioAddresses } from '../../modules/FioAddress/action'
import { FioActionSubmit } from '../../modules/FioAddress/components/FioActionSubmit'
import { getDomainSetVisibilityFee, getRenewalFee, getTransferFee, renewFioName, setDomainVisibility } from '../../modules/FioAddress/util'
import type { RootState } from '../../reducers/RootReducer'
import type { Dispatch } from '../../types/reduxTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ClickableText, PrimaryButton, SecondaryButton } from '../themed/ThemedButtons'
import { Tile } from '../themed/Tile'
import { SEND_ACTION_TYPE } from './FioTransferDomain.js'

type State = {
  showRenew: boolean,
  showVisibility: boolean,
  showTransfer: boolean
}

type StateProps = {
  denominationMultiplier: string,
  isConnected: boolean
}

type DispatchProps = {
  refreshAllFioAddresses: () => void
}

type NavigationProps = {
  fioWallet: EdgeCurrencyWallet,
  fioDomainName: string,
  isPublic: boolean,
  expiration: string
}

type Props = NavigationProps & StateProps & ThemeProps & DispatchProps

export class FioDomainSettingsComponent extends React.Component<Props, State> {
  state: State = {
    showRenew: false,
    showVisibility: false,
    showTransfer: false
  }

  afterSuccess = () => {
    this.props.refreshAllFioAddresses()
    Actions.pop()
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

  setDomainVisibility = async (fee: number) => {
    const { fioWallet, fioDomainName, isPublic, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    await setDomainVisibility(fioWallet, fioDomainName, !isPublic, fee)
  }

  renewDomain = async (fee: number) => {
    const { fioWallet, fioDomainName, isConnected } = this.props
    if (!isConnected) {
      throw new Error(s.strings.fio_network_alert_text)
    }

    await renewFioName(fioWallet, fioDomainName, fee, true)
  }

  goToTransfer = (params: { fee: number }) => {
    const { fee } = params
    if (!fee) {
      showError(s.strings.fio_get_fee_err_msg)
    } else {
      this.cancelOperation()
      Actions[Constants.FIO_TRANSFER_DOMAIN]({
        amount: fee,
        actionType: SEND_ACTION_TYPE.fioTransferDomain,
        walletId: this.props.fioWallet.id,
        fioDomain: this.props.fioDomainName,
        fioWallet: this.props.fioWallet
      })
    }
  }

  render() {
    const { fioWallet, fioDomainName, expiration, isPublic, theme } = this.props
    const { showRenew, showVisibility, showTransfer } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="header">
        <Tile type="static" title={s.strings.fio_domain_label} body={`${Constants.FIO_ADDRESS_DELIMITER} ${fioDomainName}`} />
        <Tile type="static" title={s.strings.fio_address_details_screen_expires} body={formatDate(new Date(expiration))} />
        {showVisibility && (
          <FioActionSubmit
            title={isPublic ? s.strings.title_fio_make_private_domain : s.strings.title_fio_make_public_domain}
            onSubmit={this.setDomainVisibility}
            onSuccess={this.afterSuccess}
            getOperationFee={getDomainSetVisibilityFee}
            successMessage={isPublic ? s.strings.fio_domain_is_private_label : s.strings.fio_domain_is_public_label}
            fioWallet={fioWallet}
          />
        )}
        {showRenew && (
          <FioActionSubmit
            title={s.strings.title_fio_renew_domain}
            onSubmit={this.renewDomain}
            onSuccess={this.afterSuccess}
            getOperationFee={this.getRenewalFee}
            successMessage={s.strings.fio_request_renew_domain_ok_text}
            fioWallet={fioWallet}
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
        <View style={styles.spacer} />
        {(showRenew || showVisibility) && <SecondaryButton onPress={this.cancelOperation} label={s.strings.string_cancel_cap} marginRem={[0.25, 1]} />}
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
  }
}))

export const FioDomainSettingsScene = connect(
  (state: RootState) => ({
    isConnected: state.network.isConnected
  }),
  (dispatch: Dispatch): DispatchProps => ({
    refreshAllFioAddresses: () => {
      dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(FioDomainSettingsComponent))
