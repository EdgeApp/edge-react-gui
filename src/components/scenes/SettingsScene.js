// @flow

import { type EdgeAccount, type EdgeContext, type EdgeLogType } from 'edge-core-js'
import { getSupportedBiometryType } from 'edge-login-ui-rn'
import * as React from 'react'
import { ScrollView, Text } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { showSendLogsModal } from '../../actions/LogActions.js'
import { logoutRequest } from '../../actions/LoginActions.js'
import {
  setAutoLogoutTimeInSecondsRequest,
  setDeveloperModeOn,
  showRestoreWalletsModal,
  showUnlockSettingsModal,
  togglePinLoginEnabled,
  updateTouchIdEnabled
} from '../../actions/SettingsActions'
import { CURRENCY_SETTINGS_KEYS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors.js'
import { config } from '../../theme/appConfig.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { secondsToDisplay } from '../../util/displayTime.js'
import { Collapsable } from '../common/Collapsable.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { CryptoIcon } from '../icons/CryptoIcon.js'
import { AutoLogoutModal } from '../modals/AutoLogoutModal.js'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal.js'
import { TextInputModal } from '../modals/TextInputModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, changeTheme, withTheme } from '../services/ThemeContext.js'
import { MainButton } from '../themed/MainButton.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SettingsLabelRow } from '../themed/SettingsLabelRow.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'
import { SettingsTappableRow } from '../themed/SettingsTappableRow.js'

type OwnProps = {
  navigation: NavigationProp<'settingsOverview'>
}
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
  dispatchUpdateEnableTouchIdEnable: (arg: boolean, account: EdgeAccount) => Promise<void>,
  handleSendLogs: () => void,
  lockSettings: () => void,
  onTogglePinLoginEnabled: (enableLogin: boolean) => Promise<void>,
  setAutoLogoutTimeInSeconds: (autoLogoutTimeInSeconds: number) => void,
  showRestoreWalletsModal: () => void,
  showUnlockSettingsModal: () => void,
  toggleDeveloperMode: (developerModeOn: boolean) => void,
  logoutRequest: () => Promise<void>
}
type Props = StateProps & DispatchProps & OwnProps & ThemeProps

type State = {
  touchIdText: string,
  darkTheme: boolean,
  defaultLogLevel: EdgeLogType | 'silent'
}

export class SettingsSceneComponent extends React.Component<Props, State> {
  cleanups: Array<() => mixed> = []

  constructor(props: Props) {
    super(props)

    const { logSettings } = this.props.context
    this.state = {
      touchIdText: s.strings.settings_button_use_touchID,
      darkTheme: this.props.theme === config.darkTheme,
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
    const { navigation } = this.props
    this.props.isLocked ? this.handleUnlock() : navigation.navigate('changePassword')
  }

  handleChangePin = (): void => {
    const { navigation } = this.props
    this.props.isLocked ? this.handleUnlock() : navigation.navigate('changePin')
  }

  handleChangeOtp = (): void => {
    const { navigation } = this.props
    this.props.isLocked ? this.handleUnlock() : navigation.navigate('otpSetup')
  }

  handleChangeRecovery = (): void => {
    const { navigation } = this.props
    this.props.isLocked ? this.handleUnlock() : navigation.navigate('passwordRecovery')
  }

  handleDeleteAccount = async (): Promise<void> => {
    if (this.props.isLocked) return this.handleUnlock()

    const approveDelete = await Airship.show(bridge => (
      <ConfirmContinueModal
        bridge={bridge}
        body={sprintf(s.strings.delete_account_body, config.appName, config.supportSite)}
        title={s.strings.delete_account_title}
        isSkippable
        warning
      />
    ))

    if (approveDelete !== true) return

    const { username } = this.props.account
    await Airship.show(bridge => (
      <TextInputModal
        bridge={bridge}
        submitLabel={s.strings.string_delete}
        message={sprintf(s.strings.delete_account_verification_body, username)}
        title={s.strings.delete_account_title}
        warning
        onSubmit={async text => {
          if (text !== username) return s.strings.delete_account_verification_error

          await this.props.account.deleteRemoteAccount()
          await this.props.logoutRequest()
          await this.props.context.deleteLocalAccount(username)
          return true
        }}
      />
    ))
  }

  handleExchangeSettings = (): void => {
    const { navigation } = this.props
    navigation.navigate('exchangeSettings')
  }

  handleSpendingLimits = (): void => {
    const { navigation } = this.props
    navigation.navigate('spendingLimits')
  }

  handleAutoLogout = (): void => {
    Airship.show(bridge => <AutoLogoutModal autoLogoutTimeInSeconds={this.props.autoLogoutTimeInSeconds} bridge={bridge} />).then(result => {
      if (typeof result === 'number') {
        this.props.setAutoLogoutTimeInSeconds(result)
      }
    })
  }

  handleDefaultFiat = (): void => {
    const { navigation } = this.props
    navigation.navigate('defaultFiatSetting')
  }

  handlePromotionSettings = (): void => {
    const { navigation } = this.props
    navigation.navigate('promotionSettings')
  }

  handlePinToggle = async (): Promise<void> => {
    await this.props.onTogglePinLoginEnabled(!this.props.pinLoginEnabled)
  }

  handleTouchIdToggle = async (): Promise<void> => {
    await this.props.dispatchUpdateEnableTouchIdEnable(!this.props.touchIdEnabled, this.props.account)
  }

  handleNotificationSettings = (): void => {
    const { navigation } = this.props
    navigation.navigate('notificationSettings')
  }

  handleDeveloperToggle = (): void => {
    this.props.toggleDeveloperMode(!this.props.developerModeOn)
  }

  handleDarkThemeToggle = (): void => {
    this.setState({ darkTheme: !this.state.darkTheme }, () => {
      this.state.darkTheme ? changeTheme(config.darkTheme) : changeTheme(config.lightTheme)
    })
  }

  handleTermsOfService = (): void => {
    const { navigation } = this.props
    navigation.navigate('termsOfService')
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

  render() {
    const { account, theme, handleSendLogs, isLocked, navigation } = this.props
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

    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <ScrollView>
          <SettingsHeaderRow
            icon={<FontAwesomeIcon color={theme.icon} name="user-o" size={iconSize} />}
            label={`${s.strings.settings_account_title_cap}: ${account.username}`}
          />
          <SettingsTappableRow
            action={isLocked ? 'lock' : 'unlock'}
            label={isLocked ? s.strings.settings_button_unlock_settings : s.strings.settings_button_lock_settings}
            onPress={this.handleUnlock}
          />
          <SettingsTappableRow disabled={this.props.isLocked} label={s.strings.settings_button_change_password} onPress={this.handleChangePassword} />
          <SettingsTappableRow disabled={this.props.isLocked} label={s.strings.settings_button_pin} onPress={this.handleChangePin} />
          <SettingsTappableRow disabled={this.props.isLocked} label={s.strings.settings_button_setup_two_factor} onPress={this.handleChangeOtp} />
          <SettingsTappableRow disabled={this.props.isLocked} label={s.strings.settings_button_password_recovery} onPress={this.handleChangeRecovery} />

          <Collapsable minHeightRem={0} maxHeightRem={3.25} isCollapsed={this.props.isLocked}>
            <SettingsTappableRow disabled={this.props.isLocked} onPress={this.handleDeleteAccount}>
              <Text style={styles.text}>{s.strings.delete_account_title}</Text>
            </SettingsTappableRow>
          </Collapsable>

          <SettingsHeaderRow icon={<IonIcon color={theme.icon} name="ios-options" size={iconSize} />} label={s.strings.settings_options_title_cap} />
          <SettingsTappableRow label={s.strings.settings_exchange_settings} onPress={this.handleExchangeSettings} />
          <SettingsTappableRow label={s.strings.spending_limits} onPress={this.handleSpendingLimits} />
          <SettingsLabelRow right={autoLogoutRightText} label={s.strings.settings_title_auto_logoff} onPress={this.handleAutoLogout} />
          <SettingsLabelRow right={this.props.defaultFiat.replace('iso:', '')} label={s.strings.settings_title_currency} onPress={this.handleDefaultFiat} />

          <SettingsSwitchRow key="pinRelogin" label={s.strings.settings_title_pin_login} value={this.props.pinLoginEnabled} onPress={this.handlePinToggle} />
          {this.props.supportsTouchId && (
            <SettingsSwitchRow key="useTouchID" label={this.state.touchIdText} value={this.props.touchIdEnabled} onPress={this.handleTouchIdToggle} />
          )}

          <SettingsTappableRow label={s.strings.settings_notifications} onPress={this.handleNotificationSettings} />
          {CURRENCY_SETTINGS_KEYS.map(pluginId => {
            if (account.currencyConfig[pluginId] == null) return null
            const { currencyInfo } = account.currencyConfig[pluginId]
            const { displayName } = currencyInfo
            const onPress = () =>
              navigation.navigate('currencySettings', {
                currencyInfo
              })

            return (
              <SettingsTappableRow key={pluginId} label={displayName} onPress={onPress}>
                <CryptoIcon marginRem={[0.5, 0]} pluginId={pluginId} sizeRem={1.25} />
              </SettingsTappableRow>
            )
          })}

          <SettingsTappableRow label={s.strings.title_promotion_settings} onPress={this.handlePromotionSettings} />
          <SettingsSwitchRow
            key="developerMode"
            label={s.strings.settings_developer_mode}
            value={this.props.developerModeOn}
            onPress={this.handleDeveloperToggle}
          />
          {this.props.developerModeOn && (
            <SettingsSwitchRow key="darkTheme" label={s.strings.settings_dark_theme} value={this.state.darkTheme} onPress={this.handleDarkThemeToggle} />
          )}
          <SettingsTappableRow label={s.strings.restore_wallets_modal_title} onPress={this.props.showRestoreWalletsModal} />
          <SettingsTappableRow label={s.strings.title_terms_of_service} onPress={this.handleTermsOfService} />
          <SettingsSwitchRow
            key="verboseLogging"
            label={s.strings.settings_verbose_logging}
            value={this.state.defaultLogLevel === 'info'}
            onPress={this.handleVerboseLoggingToggle}
          />
          <MainButton alignSelf="center" label={s.strings.settings_button_send_logs} marginRem={2} type="secondary" onPress={handleSendLogs} />
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  text: {
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    textAlign: 'left',
    paddingHorizontal: theme.rem(0.5),
    color: theme.dangerText
  }
}))

export const SettingsScene = connect<StateProps, DispatchProps, OwnProps>(
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
    async dispatchUpdateEnableTouchIdEnable(arg: boolean, account: EdgeAccount) {
      await dispatch(updateTouchIdEnabled(arg, account))
    },
    handleSendLogs() {
      dispatch(showSendLogsModal())
    },
    lockSettings() {
      dispatch({
        type: 'UI/SETTINGS/SET_SETTINGS_LOCK',
        data: true
      })
    },
    async onTogglePinLoginEnabled(enableLogin: boolean) {
      await dispatch(togglePinLoginEnabled(enableLogin))
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
    },
    async logoutRequest() {
      await dispatch(logoutRequest())
    }
  })
)(withTheme(SettingsSceneComponent))
