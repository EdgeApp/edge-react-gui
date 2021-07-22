// @flow

import { type EdgeAccount, type EdgeContext, type EdgeLogType } from 'edge-core-js'
import { getSupportedBiometryType } from 'edge-login-ui-rn'
import * as React from 'react'
import { Image, ScrollView } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'

import {
  setAutoLogoutTimeInSecondsRequest,
  setDeveloperModeOn,
  showRestoreWalletsModal,
  showUnlockSettingsModal,
  togglePinLoginEnabled,
  updateTouchIdEnabled
} from '../../actions/SettingsActions'
import {
  CHANGE_PASSWORD,
  CHANGE_PIN,
  CURRENCY_SETTINGS,
  DEFAULT_FIAT_SETTING,
  EXCHANGE_SETTINGS,
  NOTIFICATION_SETTINGS,
  OTP_SETUP,
  PROMOTION_SETTINGS,
  RECOVER_PASSWORD,
  SPENDING_LIMITS,
  TERMS_OF_SERVICE
} from '../../constants/SceneKeys.js'
import { CURRENCY_SETTINGS_KEYS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors.js'
import { edgeDark } from '../../theme/variables/edgeDark.js'
import { edgeLight } from '../../theme/variables/edgeLight.js'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { secondsToDisplay } from '../../util/displayTime.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { AutoLogoutModal } from '../modals/AutoLogoutModal.js'
import { SendLogsModal } from '../modals/SendLogsModal'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, changeTheme, getTheme, withTheme } from '../services/ThemeContext.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SettingsLabelRow } from '../themed/SettingsLabelRow.js'
import { SettingsRow } from '../themed/SettingsRow.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'
import { PrimaryButton } from '../themed/ThemedButtons.js'

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext,
  autoLogoutTimeInSeconds: number,
  defaultFiat: string,
  developerModeOn: boolean,
  isLocked: boolean,
  pinLoginEnabled: boolean,
  supportsTouchId: boolean,
  touchIdEnabled: boolean
}
type DispatchProps = {
  dispatchUpdateEnableTouchIdEnable: (arg: boolean, account: EdgeAccount) => void,
  lockSettings: () => void,
  onTogglePinLoginEnabled: (enableLogin: boolean) => void,
  setAutoLogoutTimeInSeconds: (autoLogoutTimeInSeconds: number) => void,
  showRestoreWalletsModal: () => void,
  showUnlockSettingsModal: () => void,
  toggleDeveloperMode: (developerModeOn: boolean) => void
}
type Props = StateProps & DispatchProps & ThemeProps

type State = {
  touchIdText: string,
  darkTheme: boolean,
  defaultLogLevel: EdgeLogType | 'silent'
}

export class SettingsSceneComponent extends React.Component<Props, State> {
  cleanups: Array<() => mixed> = []

  constructor(props: Props) {
    super(props)
    const theme = getTheme()
    const { logSettings } = this.props.context
    this.state = {
      touchIdText: s.strings.settings_button_use_touchID,
      darkTheme: theme === edgeDark,
      defaultLogLevel: logSettings.defaultLogLevel
    }
  }

  componentDidMount() {
    this.loadBiometryType().catch(showError)
    this.cleanups = [
      this.props.context.watch('logSettings', logSettings => {
        this.setState({ defaultLogLevel: logSettings.defaultLogLevel })
      })
    ]
  }

  componentWillUnmount() {
    for (const cleanup of this.cleanups) cleanup()
  }

  async loadBiometryType(): Promise<void> {
    if (!this.props.supportsTouchId) return

    const biometryType = await getSupportedBiometryType()
    switch (biometryType) {
      case 'FaceID':
        this.setState({ touchIdText: s.strings.settings_button_use_faceID })
        break
      case 'TouchID':
        this.setState({ touchIdText: s.strings.settings_button_use_touchID })
        break
      case 'Fingerprint':
        this.setState({ touchIdText: s.strings.settings_button_use_biometric })
    }
  }

  handleUnlock = (): void => {
    if (!this.props.isLocked) {
      this.props.lockSettings()
    } else {
      this.props.showUnlockSettingsModal()
    }
  }

  handleChangePassword = (): void => {
    this.props.isLocked ? this.handleUnlock() : Actions.push(CHANGE_PASSWORD)
  }

  handleChangePin = (): void => {
    this.props.isLocked ? this.handleUnlock() : Actions.push(CHANGE_PIN)
  }

  handleChangeOtp = (): void => {
    this.props.isLocked ? this.handleUnlock() : Actions.push(OTP_SETUP)
  }

  handleChangeRecovery = (): void => {
    this.props.isLocked ? this.handleUnlock() : Actions.push(RECOVER_PASSWORD)
  }

  handleExchangeSettings = (): void => {
    Actions.push(EXCHANGE_SETTINGS)
  }

  handleSpendingLimits = (): void => {
    Actions.push(SPENDING_LIMITS)
  }

  handleAutoLogout = (): void => {
    Airship.show(bridge => <AutoLogoutModal autoLogoutTimeInSeconds={this.props.autoLogoutTimeInSeconds} bridge={bridge} />).then(result => {
      if (typeof result === 'number') {
        this.props.setAutoLogoutTimeInSeconds(result)
      }
    })
  }

  handleDefaultFiat = (): void => {
    Actions.push(DEFAULT_FIAT_SETTING)
  }

  handlePromotionSettings = (): void => {
    Actions.push(PROMOTION_SETTINGS)
  }

  handlePinToggle = (): void => {
    this.props.onTogglePinLoginEnabled(!this.props.pinLoginEnabled)
  }

  handleTouchIdToggle = (): void => {
    this.props.dispatchUpdateEnableTouchIdEnable(!this.props.touchIdEnabled, this.props.account)
  }

  handleNotificationSettings = (): void => {
    Actions.push(NOTIFICATION_SETTINGS)
  }

  handleDeveloperToggle = (): void => {
    this.props.toggleDeveloperMode(!this.props.developerModeOn)
  }

  handleDarkThemeToggle = (): void => {
    this.setState({ darkTheme: !this.state.darkTheme }, () => {
      this.state.darkTheme ? changeTheme(edgeDark) : changeTheme(edgeLight)
    })
  }

  handleTermsOfService = (): void => {
    Actions.push(TERMS_OF_SERVICE)
  }

  handleVerboseLoggingToggle = (): void => {
    const defaultLogLevel = this.state.defaultLogLevel === 'info' ? 'warn' : 'info'
    this.setState({ defaultLogLevel })
    this.props.context
      .changeLogSettings({
        defaultLogLevel,
        sources: {}
      })
      .catch(showError)
  }

  handleSendLogs = (): void => {
    Airship.show(bridge => <SendLogsModal bridge={bridge} />)
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

    const rightArrow = <AntDesignIcon color={theme.icon} name="right" size={theme.rem(1)} />

    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <ScrollView>
          <SettingsHeaderRow
            icon={<FontAwesomeIcon color={theme.icon} name="user-o" size={iconSize} />}
            text={`${s.strings.settings_account_title_cap}: ${account.username}`}
          />
          <SettingsRow
            right={<AntDesignIcon color={theme.iconTappable} name={isLocked ? 'lock' : 'unlock'} size={iconSize} />}
            text={isLocked ? s.strings.settings_button_unlock_settings : s.strings.settings_button_lock_settings}
            onPress={this.handleUnlock}
          />
          <SettingsRow disabled={this.props.isLocked} right={rightArrow} text={s.strings.settings_button_change_password} onPress={this.handleChangePassword} />
          <SettingsRow disabled={this.props.isLocked} right={rightArrow} text={s.strings.settings_button_pin} onPress={this.handleChangePin} />
          <SettingsRow disabled={this.props.isLocked} right={rightArrow} text={s.strings.settings_button_setup_two_factor} onPress={this.handleChangeOtp} />
          <SettingsRow
            bottomGap={false}
            disabled={this.props.isLocked}
            right={rightArrow}
            text={s.strings.settings_button_password_recovery}
            onPress={this.handleChangeRecovery}
          />

          <SettingsHeaderRow icon={<IonIcon color={theme.icon} name="ios-options" size={iconSize} />} text={s.strings.settings_options_title_cap} />
          <SettingsRow right={rightArrow} text={s.strings.settings_exchange_settings} onPress={this.handleExchangeSettings} />
          <SettingsRow right={rightArrow} text={s.strings.spending_limits} onPress={this.handleSpendingLimits} />
          <SettingsLabelRow right={autoLogoutRightText} text={s.strings.settings_title_auto_logoff} onPress={this.handleAutoLogout} />
          <SettingsLabelRow right={this.props.defaultFiat.replace('iso:', '')} text={s.strings.settings_title_currency} onPress={this.handleDefaultFiat} />

          <SettingsSwitchRow key="pinRelogin" text={s.strings.settings_title_pin_login} value={this.props.pinLoginEnabled} onPress={this.handlePinToggle} />
          {this.props.supportsTouchId && (
            <SettingsSwitchRow key="useTouchID" text={this.state.touchIdText} value={this.props.touchIdEnabled} onPress={this.handleTouchIdToggle} />
          )}

          <SettingsRow right={rightArrow} text={s.strings.settings_notifications} onPress={this.handleNotificationSettings} />
          {CURRENCY_SETTINGS_KEYS.map(pluginId => {
            if (account.currencyConfig[pluginId] == null) return null
            const { currencyInfo } = account.currencyConfig[pluginId]
            const { displayName, currencyCode } = currencyInfo
            const { symbolImage } = getCurrencyIcon(currencyCode)
            const icon = <Image source={{ uri: symbolImage }} style={styles.currencyLogo} />
            const onPress = () =>
              Actions.push(CURRENCY_SETTINGS, {
                currencyInfo
              })

            return <SettingsRow key={pluginId} icon={icon} right={rightArrow} text={displayName} onPress={onPress} />
          })}

          <SettingsRow right={rightArrow} text={s.strings.title_promotion_settings} onPress={this.handlePromotionSettings} />
          <SettingsSwitchRow
            key="developerMode"
            text={s.strings.settings_developer_mode}
            value={this.props.developerModeOn}
            onPress={this.handleDeveloperToggle}
          />
          {this.props.developerModeOn && (
            <SettingsSwitchRow key="darkTheme" text={s.strings.settings_dark_theme} value={this.state.darkTheme} onPress={this.handleDarkThemeToggle} />
          )}
          <SettingsRow text={s.strings.restore_wallets_modal_title} onPress={this.props.showRestoreWalletsModal} />
          <SettingsRow right={rightArrow} text={s.strings.title_terms_of_service} onPress={this.handleTermsOfService} />
          <SettingsSwitchRow
            key="verboseLogging"
            text={s.strings.settings_verbose_logging}
            value={this.state.defaultLogLevel === 'info'}
            onPress={this.handleVerboseLoggingToggle}
          />
          <PrimaryButton label={s.strings.settings_button_send_logs} marginRem={2} onPress={this.handleSendLogs} />
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => {
  const iconSize = theme.rem(1.25)
  return {
    currencyLogo: {
      height: iconSize,
      width: iconSize,
      resizeMode: 'contain'
    }
  }
})

export const SettingsScene = connect<StateProps, DispatchProps, {}>(
  state => ({
    account: state.core.account,
    context: state.core.context,
    autoLogoutTimeInSeconds: state.ui.settings.autoLogoutTimeInSeconds,
    defaultFiat: getDefaultFiat(state),
    developerModeOn: state.ui.settings.developerModeOn,
    isLocked: state.ui.settings.changesLocked,
    pinLoginEnabled: state.ui.settings.pinLoginEnabled,
    supportsTouchId: state.ui.settings.isTouchSupported,
    touchIdEnabled: state.ui.settings.isTouchEnabled
  }),
  dispatch => ({
    dispatchUpdateEnableTouchIdEnable(arg: boolean, account: EdgeAccount) {
      dispatch(updateTouchIdEnabled(arg, account))
    },
    lockSettings() {
      dispatch({
        type: 'UI/SETTINGS/SET_SETTINGS_LOCK',
        data: true
      })
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
    showUnlockSettingsModal() {
      dispatch(showUnlockSettingsModal())
    },
    toggleDeveloperMode(developerModeOn: boolean) {
      dispatch(setDeveloperModeOn(developerModeOn))
    }
  })
)(withTheme(SettingsSceneComponent))
