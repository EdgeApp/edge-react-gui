// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import * as Constants from '../../constants/indexConstants'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings'
import { refreshAllFioAddresses } from '../../modules/FioAddress/action'
import { FioActionSubmit } from '../../modules/FioAddress/components/FioActionSubmit'
import { getDomainSetVisibilityFee, getRenewalFee, getTransferFee, renewFioName, setDomainVisibility } from '../../modules/FioAddress/util'
import { PrimaryButton2 } from '../../modules/UI/components/Buttons/PrimaryButton2.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import type { RootState } from '../../reducers/RootReducer'
import type { Dispatch } from '../../types/reduxTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { SecondaryButton } from '../themed/ThemedButtons'
import { SEND_ACTION_TYPE } from './SendScene'

export type State = {
  showRenew: boolean,
  showVisibility: boolean,
  showTransfer: boolean
}

export type StateProps = {
  denominationMultiplier: string,
  isConnected: boolean
}

export type DispatchProps = {
  refreshAllFioAddresses: () => void
}

export type NavigationProps = {
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
      showError(s.strings.fio_network_alert_text)
      return
    }

    await renewFioName(fioWallet, fioDomainName, fee, true)
  }

  goToTransfer = (params: { fee: number }) => {
    const { fee } = params
    if (!fee) {
      showError(s.strings.fio_get_fee_err_msg)
    } else {
      this.cancelOperation()
      Actions[Constants.SEND]({
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
        <View style={styles.info}>
          <T style={styles.title}>{s.strings.fio_domain_label}</T>
          <T style={styles.content}>
            {Constants.FIO_ADDRESS_DELIMITER}
            {fioDomainName}
          </T>
        </View>
        <View style={styles.info}>
          <T style={styles.title}>{s.strings.fio_address_details_screen_expires}</T>
          <T style={styles.content}>{intl.formatExpDate(expiration)}</T>
        </View>
        {showVisibility && (
          <FioActionSubmit
            onSubmit={this.setDomainVisibility}
            onSuccess={this.afterSuccess}
            getOperationFee={getDomainSetVisibilityFee}
            successMessage={isPublic ? s.strings.fio_domain_is_private_label : s.strings.fio_domain_is_public_label}
            fioWallet={fioWallet}
          />
        )}
        {showRenew && (
          <FioActionSubmit
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
            <View style={styles.spacer} />
            <View style={styles.blockPadding}>
              <PrimaryButton2 onPress={this.onRenewPress}>
                <PrimaryButton2.Text>{s.strings.title_fio_renew_domain}</PrimaryButton2.Text>
              </PrimaryButton2>
            </View>
            <View style={styles.blockPadding}>
              <PrimaryButton2 onPress={this.onTransferPress}>
                <PrimaryButton2.Text>{s.strings.title_fio_transfer_domain}</PrimaryButton2.Text>
              </PrimaryButton2>
            </View>
            <View style={styles.blockPadding}>
              <TouchableHighlight onPress={this.onVisibilityPress} underlayColor="transparent">
                <T style={styles.highlightBtn}>{isPublic ? s.strings.title_fio_make_private_domain : s.strings.title_fio_make_public_domain}</T>
              </TouchableHighlight>
            </View>
          </>
        )}
        <View style={styles.spacer} />
        {(showRenew || showVisibility) && (
          <View style={styles.blockPadding}>
            <SecondaryButton onPress={this.cancelOperation} label={s.strings.string_cancel_cap} />
          </View>
        )}
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  info: {
    backgroundColor: theme.tileBackground,
    paddingVertical: theme.rem(1),
    paddingHorizontal: theme.rem(1),
    marginBottom: theme.rem(0.25)
  },
  title: {
    color: theme.secondaryText,
    marginBottom: theme.rem(0.25),
    fontSize: theme.rem(0.75),
    fontWeight: 'normal',
    textAlign: 'left'
  },
  content: {
    color: theme.primaryText,
    fontSize: theme.rem(1),
    textAlign: 'left'
  },
  blockPadding: {
    paddingTop: theme.rem(0.5),
    paddingLeft: theme.rem(1.25),
    paddingRight: theme.rem(1.25)
  },
  spacer: {
    paddingTop: theme.rem(1.25)
  },
  highlightBtn: {
    color: theme.primaryText,
    textAlign: 'center',
    padding: theme.rem(0.5)
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
