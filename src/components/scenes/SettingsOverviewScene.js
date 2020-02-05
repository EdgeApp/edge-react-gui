// @flow

import type { EdgeAccount } from 'edge-core-js'
import { getSupportedBiometryType } from 'edge-login-ui-rn'
import React, { type Node, Component } from 'react'
import { Image, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Action } from '../../types/reduxTypes.js'
import { secondsToDisplay } from '../../util/displayTime.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow.js'
import { SettingsLabelRow } from '../common/SettingsLabelRow.js'
import { SettingsRow } from '../common/SettingsRow.js'
import { SettingsSwitchRow } from '../common/SettingsSwitchRow.js'
import { AutoLogoutModal } from '../modals/AutoLogoutModal.js'
import { Airship, showToast } from '../services/AirshipInstance.js'

type Props = {
  defaultFiat: string,
  autoLogoutTimeInSeconds: number,
  username: string,
  account: EdgeAccount,
  pinLoginEnabled: boolean,
  supportsTouchId: boolean,
  touchIdEnabled: boolean,
  lockButton: string,
  lockButtonIcon: string,
  isLocked: boolean,
  confirmPasswordError: string,
  developerModeOn: boolean,
  setAutoLogoutTimeInSeconds(number): void,
  confirmPassword(string): void,
  lockSettings(): void,
  dispatchUpdateEnableTouchIdEnable(boolean, EdgeAccount): void,
  resetConfirmPasswordError(Object): void,
  onTogglePinLoginEnabled(enableLogin: boolean): void,
  otpResetDate: string,
  showReEnableOtpModal: () => Promise<Action>,
  showUnlockSettingsModal: () => void,
  showSendLogsModal: () => void,
  showRestoreWalletsModal: () => void,
  toggleDeveloperMode(boolean): void
}

type State = {
  touchIdText: string
}

export default class SettingsOverview extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      touchIdText: s.strings.settings_button_use_touchID
    }
  }

  async componentDidMount () {
    if (!this.props.supportsTouchId) {
      return null
    }
    try {
      const biometryType = await getSupportedBiometryType()
      switch (biometryType) {
        case 'FaceID':
          this.setState({ touchIdText: s.strings.settings_button_use_faceID })
          return null
        case 'TouchID':
          this.setState({ touchIdText: s.strings.settings_button_use_touchID })
          return null
        case 'Fingerprint':
          this.setState({ touchIdText: s.strings.settings_button_use_biometric })
          return null
        default:
          return null
      }
    } catch (error) {
      console.log(error)
    }
  }

  unlockSettingsAlert () {
    showToast(s.strings.settings_alert_unlock)
  }
  _onPressChangePasswordRouting = () => {
    return this.props.isLocked ? this.unlockSettingsAlert() : Actions[Constants.CHANGE_PASSWORD]()
  }
  _onPressChangePinRouting = () => {
    return this.props.isLocked ? this.unlockSettingsAlert() : Actions[Constants.CHANGE_PIN]()
  }
  _onPressOtp = () => {
    return this.props.isLocked ? this.unlockSettingsAlert() : Actions[Constants.OTP_SETUP]()
  }
  _onPressRecoverPasswordRouting = () => {
    return this.props.isLocked ? this.unlockSettingsAlert() : Actions[Constants.RECOVER_PASSWORD]()
  }

  _onPressExchangeSettings = () => {
    Actions[Constants.EXCHANGE_SETTINGS]()
  }

  _onPressSpendingLimits = () => {
    return Actions[Constants.SPENDING_LIMITS]()
  }

  _onPressOpenLogoffTime = () => {}

  _onPressOpenDefaultCurrency = () => {}

  _onPressOpenChangeCategories = () => {}

  _onTogglePinLogin = () => {
    this.props.onTogglePinLoginEnabled(!this.props.pinLoginEnabled)
  }

  _onToggleTouchIdOption = () => {
    this.props.dispatchUpdateEnableTouchIdEnable(!this.props.touchIdEnabled, this.props.account)
  }

  onDeveloperPress = () => {
    this.props.toggleDeveloperMode(!this.props.developerModeOn)
  }

  showAutoLogoutModal = async () => {
    const result = await Airship.show(bridge => <AutoLogoutModal autoLogoutTimeInSeconds={this.props.autoLogoutTimeInSeconds} bridge={bridge} />)

    if (typeof result === 'number') {
      this.props.setAutoLogoutTimeInSeconds(result)
    }
  }

  render () {
    const autoLogout = secondsToDisplay(this.props.autoLogoutTimeInSeconds)
    const timeStrings = {
      seconds: s.strings.settings_seconds,
      minutes: s.strings.settings_minutes,
      hours: s.strings.settings_hours,
      days: s.strings.settings_days
    }
    const autoLogoutRightText = autoLogout.value === 0 ? s.strings.string_disable : `${autoLogout.value} ${timeStrings[autoLogout.measurement]}`

    const rightArrow = <AntDesignIcon name="right" color={THEME.COLORS.GRAY_2} size={THEME.rem(1)} />

    return (
      <SceneWrapper background="body" hasTabs={false}>
        <ScrollView>
          <SettingsHeaderRow
            icon={<FontAwesomeIcon name="user-o" color={THEME.COLORS.WHITE} size={iconSize} />}
            text={`${s.strings.settings_account_title_cap}: ${this.props.username}`}
          />
          <SettingsRow
            text={s.strings[this.props.lockButton]}
            right={<IonIcon name={this.props.lockButtonIcon} color={THEME.COLORS.GRAY_1} size={iconSize} />}
            onPress={this.showConfirmPasswordModal}
          />
          <SettingsRow
            disabled={this.props.isLocked}
            text={s.strings.settings_button_change_password}
            right={rightArrow}
            onPress={this._onPressChangePasswordRouting}
          />
          <SettingsRow disabled={this.props.isLocked} text={s.strings.settings_button_pin} right={rightArrow} onPress={this._onPressChangePinRouting} />
          <SettingsRow disabled={this.props.isLocked} text={s.strings.settings_button_setup_two_factor} right={rightArrow} onPress={this._onPressOtp} />
          <SettingsRow
            disabled={this.props.isLocked}
            text={s.strings.settings_button_password_recovery}
            right={rightArrow}
            onPress={this._onPressRecoverPasswordRouting}
          />

          <SettingsHeaderRow icon={<IonIcon name="ios-options" color={THEME.COLORS.WHITE} size={iconSize} />} text={s.strings.settings_options_title_cap} />
          <SettingsRow text={s.strings.settings_exchange_settings} right={rightArrow} onPress={this._onPressExchangeSettings} />
          <SettingsRow text={s.strings.spending_limits} right={rightArrow} onPress={this._onPressSpendingLimits} />
          <SettingsLabelRow
            text={s.strings.settings_title_auto_logoff}
            right={autoLogoutRightText}
            onPress={() => {
              this.showAutoLogoutModal()
            }}
          />
          <SettingsLabelRow text={s.strings.settings_title_currency} right={this.props.defaultFiat.replace('iso:', '')} onPress={Actions.defaultFiatSetting} />

          <SettingsSwitchRow key="pinRelogin" text={s.strings.settings_title_pin_login} value={this.props.pinLoginEnabled} onPress={this._onTogglePinLogin} />
          {this.props.supportsTouchId && (
            <SettingsSwitchRow key={'useTouchID'} text={this.state.touchIdText} value={this.props.touchIdEnabled} onPress={this._onToggleTouchIdOption} />
          )}

          {this.renderCurrencyRows()}

          <SettingsSwitchRow key="developerMode" text={s.strings.settings_developer_mode} value={this.props.developerModeOn} onPress={this.onDeveloperPress} />
          <SettingsRow onPress={this.showRestoreWalletModal} text={s.strings.restore_wallets_modal_title} />
          <SettingsRow text={s.strings.title_terms_of_service} onPress={Actions[Constants.TERMS_OF_SERVICE]} right={rightArrow} />

          <View style={styles.bottomArea}>
            <PrimaryButton onPress={this.showSendLogsModal}>
              <PrimaryButton.Text>{s.strings.settings_button_send_logs}</PrimaryButton.Text>
            </PrimaryButton>
          </View>
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderCurrencyRows (): Node[] {
    const { account } = this.props
    const rightArrow = <AntDesignIcon name="right" color={THEME.COLORS.GRAY_2} size={THEME.rem(1)} />

    const out: Node[] = []
    for (const currencyKey in Constants.CURRENCY_SETTINGS) {
      const onPress = Actions[currencyKey]

      // Grab out the displayName & logo, if the currency exists:
      const { pluginName } = Constants.CURRENCY_SETTINGS[currencyKey]
      const currencyConfig = account.currencyConfig[pluginName]
      if (currencyConfig == null) continue
      const { displayName, symbolImage } = currencyConfig.currencyInfo
      const icon = symbolImage != null ? <Image style={styles.currencyLogo} source={{ uri: symbolImage }} /> : undefined

      out.push(<SettingsRow key={currencyKey} icon={icon} text={displayName} onPress={onPress} right={rightArrow} />)
    }
    return out
  }

  showConfirmPasswordModal = () => {
    if (!this.props.isLocked) {
      this.props.lockSettings()
    } else {
      this.props.showUnlockSettingsModal()
    }
  }

  showSendLogsModal = () => {
    this.props.showSendLogsModal()
  }

  showRestoreWalletModal = () => {
    this.props.showRestoreWalletsModal()
  }
}

const iconSize = THEME.rem(1.375)

const styles = {
  currencyLogo: {
    height: iconSize,
    width: iconSize,
    resizeMode: 'contain'
  },

  bottomArea: {
    padding: THEME.rem(1.414),
    marginBottom: THEME.rem(4)
  }
}
