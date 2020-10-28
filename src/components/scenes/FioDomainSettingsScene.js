// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings'
import { FioActionSubmit } from '../../modules/FioAddress/components/FioActionSubmit'
import { getDomainSetVisibilityFee, getRenewalFee, renewFioName, setDomainVisibility } from '../../modules/FioAddress/util'
import { PrimaryButton2 } from '../../modules/UI/components/Buttons/PrimaryButton2.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { SecondaryButton } from '../themed/ThemedButtons'

export type State = {
  showRenew: boolean,
  showVisibility: boolean
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

type Props = NavigationProps & StateProps & DispatchProps

export class FioDomainSettingsScene extends React.Component<Props, State> {
  state: State = {
    showRenew: false,
    showVisibility: false
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

  cancelOperation = () => {
    this.setState({ showRenew: false, showVisibility: false })
  }

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

  render() {
    const { fioWallet, fioDomainName, expiration, isPublic } = this.props
    const { showRenew, showVisibility } = this.state

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
            getOperationFee={getRenewalFee}
            successMessage={s.strings.fio_request_renew_domain_ok_text}
            fioWallet={fioWallet}
          />
        )}
        {!showRenew && !showVisibility && (
          <View style={styles.blockPadding}>
            <PrimaryButton2 onPress={this.onRenewPress}>
              <PrimaryButton2.Text>{s.strings.title_fio_renew_domain}</PrimaryButton2.Text>
            </PrimaryButton2>
          </View>
        )}
        {!showRenew && !showVisibility && (
          <View style={styles.blockPadding}>
            <TouchableHighlight onPress={this.onVisibilityPress} underlayColor={THEME.COLORS.TRANSACTION_DETAILS_GREY_1}>
              <T style={styles.highlightBtn}>{isPublic ? s.strings.title_fio_make_private_domain : s.strings.title_fio_make_public_domain}</T>
            </TouchableHighlight>
          </View>
        )}
        {(showRenew || showVisibility) && (
          <View style={styles.blockPadding}>
            <SecondaryButton onPress={this.cancelOperation} label={s.strings.string_cancel_cap} />
          </View>
        )}
      </SceneWrapper>
    )
  }
}

const rawStyles = {
  info: {
    backgroundColor: THEME.COLORS.SECONDARY,
    paddingVertical: THEME.rem(1),
    paddingHorizontal: THEME.rem(1),
    marginBottom: THEME.rem(0.25)
  },
  title: {
    color: THEME.COLORS.TRANSACTION_DETAILS_GREY_1,
    marginBottom: THEME.rem(0.25),
    fontSize: THEME.rem(0.75),
    fontWeight: 'normal',
    textAlign: 'left'
  },
  content: {
    color: THEME.COLORS.WHITE,
    fontSize: THEME.rem(1),
    textAlign: 'left'
  },
  blockPadding: {
    paddingTop: THEME.rem(2),
    paddingLeft: THEME.rem(1.25),
    paddingRight: THEME.rem(1.25)
  },
  spacer: {
    paddingTop: THEME.rem(1.25)
  },
  highlightBtn: {
    color: THEME.COLORS.WHITE,
    textAlign: 'center',
    padding: THEME.rem(0.5)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
