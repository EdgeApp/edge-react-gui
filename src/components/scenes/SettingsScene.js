// @flow

import type { EdgeAccount } from 'edge-core-js'
import { getSupportedBiometryType } from 'edge-login-ui-rn'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import {
  checkCurrentPassword,
  lockSettings,
  setAutoLogoutTimeInSecondsRequest,
  setDeveloperModeOn,
  showRestoreWalletsModal,
  showSendLogsModal,
  showUnlockSettingsModal,
  togglePinLoginEnabled,
  updateTouchIdEnabled
} from '../../actions/SettingsActions'
import * as Constants from '../../constants/indexConstants'
import { CURRENCY_SETTINGS_KEYS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { type ThemeProps, cacheStyles, changeTheme, getTheme, withTheme } from '../../theme/ThemeContext.js'
import { edgeDark } from '../../theme/variables/edgeDark.js'
import { edgeLight } from '../../theme/variables/edgeLight.js'
import type { Dispatch, State as RootState } from '../../types/reduxTypes.js'
import { secondsToDisplay } from '../../util/displayTime.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow.js'
import { SettingsLabelRow } from '../common/SettingsLabelRow.js'
import { SettingsRow } from '../common/SettingsRow.js'
import { SettingsSwitchRow } from '../common/SettingsSwitchRow.js'
import { AutoLogoutModal } from '../modals/AutoLogoutModal.js'
import { Airship, showToast } from '../services/AirshipInstance.js'

type StateProps = {
  account: EdgeAccount,
  autoLogoutTimeInSeconds: number,
  defaultFiat: string,
  developerModeOn: boolean,
  isLocked: boolean,
  pinLoginEnabled: boolean,
  supportsTouchId: boolean,
  touchIdEnabled: boolean
}
type DispatchProps = {
  confirmPassword(password: string): void,
  dispatchUpdateEnableTouchIdEnable(arg: boolean, account: EdgeAccount): void,
  lockSettings(): void,
  onTogglePinLoginEnabled(enableLogin: boolean): void,
  setAutoLogoutTimeInSeconds(number): void,
  showRestoreWalletsModal: () => void,
  showSendLogsModal: () => void,
  showUnlockSettingsModal: () => void,
  toggleDeveloperMode(developerModeOn: boolean): void
}
type Props = StateProps & DispatchProps & ThemeProps

type State = {
  touchIdText: string,
  darkTheme: boolean
}

export class SettingsSceneComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const theme = getTheme()
    this.state = {
      touchIdText: s.strings.settings_button_use_touchID,
      darkTheme: theme === edgeDark
    }
  }

  async componentDidMount() {
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

  unlockSettingsAlert() {
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

  _onPressPromotionSettings = () => {
    Actions.push(Constants.PROMOTION_SETTINGS)
  }

  _onTogglePinLogin = () => {
    this.props.onTogglePinLoginEnabled(!this.props.pinLoginEnabled)
  }

  _onToggleTouchIdOption = () => {
    this.props.dispatchUpdateEnableTouchIdEnable(!this.props.touchIdEnabled, this.props.account)
  }

  _onPressNotifications = () => {
    Actions[Constants.NOTIFICATION_SETTINGS]()
  }

  onDeveloperPress = () => {
    this.props.toggleDeveloperMode(!this.props.developerModeOn)
  }

  onDarkThemePress = () => {
    this.setState({ darkTheme: !this.state.darkTheme }, () => {
      this.state.darkTheme ? changeTheme(edgeDark) : changeTheme(edgeLight)
    })
  }

  showAutoLogoutModal = async () => {
    const result = await Airship.show(bridge => <AutoLogoutModal autoLogoutTimeInSeconds={this.props.autoLogoutTimeInSeconds} bridge={bridge} />)

    if (typeof result === 'number') {
      this.props.setAutoLogoutTimeInSeconds(result)
    }
  }

  render() {
    const { account, theme, isLocked } = this.props
    const iconSize = theme.rem(1.25)
    const styles = getStyles(theme)

    const autoLogout = secondsToDisplay(this.props.autoLogoutTimeInSeconds)
    const timeStrings = {
      seconds: s.strings.settings_seconds,
      minutes: s.strings.settings_minutes,
      hours: s.strings.settings_hours,
      days: s.strings.settings_days
    }
    const autoLogoutRightText = autoLogout.value === 0 ? s.strings.string_disable : `${autoLogout.value} ${timeStrings[autoLogout.measurement]}`

    const rightArrow = <AntDesignIcon name="right" color={theme.icon} size={theme.rem(1)} />

    return (
      <SceneWrapper hasTabs={false}>
        <ScrollView>
          <SettingsHeaderRow
            icon={<FontAwesomeIcon name="user-o" color={theme.icon} size={iconSize} />}
            text={`${s.strings.settings_account_title_cap}: ${account.username}`}
          />
          <SettingsRow
            text={isLocked ? s.strings.settings_button_unlock_settings : s.strings.settings_button_lock_settings}
            right={<IonIcon name={isLocked ? 'ios-lock' : 'ios-unlock'} color={theme.iconTappable} size={iconSize} />}
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
            marginBottom={false}
          />

          <SettingsHeaderRow icon={<IonIcon name="ios-options" color={theme.icon} size={iconSize} />} text={s.strings.settings_options_title_cap} />
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
            <SettingsSwitchRow key="useTouchID" text={this.state.touchIdText} value={this.props.touchIdEnabled} onPress={this._onToggleTouchIdOption} />
          )}

          <SettingsRow text={s.strings.settings_notifications} right={rightArrow} onPress={this._onPressNotifications} />
          {CURRENCY_SETTINGS_KEYS.map(pluginId => {
            if (account.currencyConfig[pluginId] == null) return null
            const { currencyInfo } = account.currencyConfig[pluginId]
            const { displayName, symbolImage } = currencyInfo
            const icon = symbolImage != null ? <Image style={styles.currencyLogo} source={{ uri: symbolImage }} /> : undefined
            const onPress = () => Actions[Constants.CURRENCY_SETTINGS]({ currencyInfo })

            return <SettingsRow key={pluginId} icon={icon} text={displayName} onPress={onPress} right={rightArrow} />
          })}

          <SettingsRow text={s.strings.title_promotion_settings} right={rightArrow} onPress={this._onPressPromotionSettings} />
          <SettingsSwitchRow key="developerMode" text={s.strings.settings_developer_mode} value={this.props.developerModeOn} onPress={this.onDeveloperPress} />
          {this.props.developerModeOn && (
            <SettingsSwitchRow key="darkTheme" text={s.strings.settings_dark_theme} value={this.state.darkTheme} onPress={this.onDarkThemePress} />
          )}
          <SettingsRow onPress={this.props.showRestoreWalletsModal} text={s.strings.restore_wallets_modal_title} />
          <SettingsRow text={s.strings.title_terms_of_service} onPress={Actions[Constants.TERMS_OF_SERVICE]} right={rightArrow} />

          <View style={styles.bottomArea}>
            <PrimaryButton onPress={this.props.showSendLogsModal} style={styles.button}>
              <PrimaryButton.Text style={styles.buttonText}>{s.strings.settings_button_send_logs}</PrimaryButton.Text>
            </PrimaryButton>
          </View>
        </ScrollView>
      </SceneWrapper>
    )
  }

  showConfirmPasswordModal = () => {
    if (!this.props.isLocked) {
      this.props.lockSettings()
    } else {
      this.props.showUnlockSettingsModal()
    }
  }
}

const getStyles = cacheStyles(theme => {
  const iconSize = theme.rem(1.25)
  return {
    currencyLogo: {
      height: iconSize,
      width: iconSize,
      resizeMode: 'contain'
    },
    bottomArea: {
      padding: theme.rem(2)
    },
    button: {
      width: '100%',
      height: theme.rem(3),
      borderRadius: theme.rem(1.5),
      backgroundColor: theme.primaryButton
    },
    buttonText: {
      color: theme.primaryButtonText
    }
  }
})

export const SettingsScene = connect(
  (state: RootState): StateProps => ({
    account: state.core.account,
    autoLogoutTimeInSeconds: SETTINGS_SELECTORS.getAutoLogoutTimeInSeconds(state),
    defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
    developerModeOn: state.ui.settings.developerModeOn,
    isLocked: SETTINGS_SELECTORS.getSettingsLock(state),
    pinLoginEnabled: SETTINGS_SELECTORS.getPinLoginEnabled(state),
    supportsTouchId: SETTINGS_SELECTORS.getIsTouchIdSupported(state),
    touchIdEnabled: SETTINGS_SELECTORS.getIsTouchIdEnabled(state)
  }),
  (dispatch: Dispatch): DispatchProps => ({
    confirmPassword(arg: string) {
      dispatch(checkCurrentPassword(arg))
    },
    dispatchUpdateEnableTouchIdEnable(arg: boolean, account: EdgeAccount) {
      dispatch(updateTouchIdEnabled(arg, account))
    },
    lockSettings() {
      dispatch(lockSettings())
    },
    onTogglePinLoginEnabled(enableLogin: boolean) {
      dispatch(togglePinLoginEnabled(enableLogin))
    },
    setAutoLogoutTimeInSeconds(autoLogoutTimeInSeconds: number) {
      dispatch(setAutoLogoutTimeInSecondsRequest(autoLogoutTimeInSeconds))
    },
    showRestoreWalletsModal() {
      dispatch(showRestoreWalletsModal())
    },
    showSendLogsModal() {
      dispatch(showSendLogsModal())
    },
    showUnlockSettingsModal() {
      dispatch(showUnlockSettingsModal())
    },
    toggleDeveloperMode(developerModeOn: boolean) {
      dispatch(setDeveloperModeOn(developerModeOn))
    }
  })
)(withTheme(SettingsSceneComponent))
