import { EdgeAccount, EdgeContext, EdgeLogType } from 'edge-core-js'
import { getSupportedBiometryType } from 'edge-login-ui-rn'
import * as React from 'react'
import { Platform, ScrollView } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { showBackupModal } from '../../actions/BackupModalActions'
import { setContactsPermissionOn, setDeveloperModeOn, setSpamFilterOn } from '../../actions/LocalSettingsActions'
import { showClearLogsModal, showSendLogsModal } from '../../actions/LogActions'
import { logoutRequest } from '../../actions/LoginActions'
import {
  setAutoLogoutTimeInSecondsRequest,
  showRestoreWalletsModal,
  showUnlockSettingsModal,
  togglePinLoginEnabled,
  updateTouchIdEnabled
} from '../../actions/SettingsActions'
import { CURRENCY_SETTINGS_KEYS } from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationBase } from '../../types/routerTypes'
import { secondsToDisplay } from '../../util/displayTime'
import { SceneWrapper } from '../common/SceneWrapper'
import { TextDropdown } from '../common/TextDropdown'
import { CryptoIcon } from '../icons/CryptoIcon'
import { Space } from '../layout/Space'
import { AutoLogoutModal } from '../modals/AutoLogoutModal'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { changeTheme, ThemeProps, useTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsLabelRow } from '../settings/SettingsLabelRow'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { SettingsTappableRow } from '../settings/SettingsTappableRow'
import { MainButton } from '../themed/MainButton'

interface OwnProps extends EdgeSceneProps<'settingsOverview'> {}

interface StateProps {
  account: EdgeAccount
  autoLogoutTimeInSeconds: number
  contactsPermissionOn: boolean
  context: EdgeContext
  defaultFiat: string
  developerModeOn: boolean
  isLocked: boolean
  pinLoginEnabled: boolean
  spamFilterOn: boolean
  supportsTouchId: boolean
  touchIdEnabled: boolean
  username: string | undefined
}
interface DispatchProps {
  dispatchUpdateEnableTouchIdEnable: (arg: boolean, account: EdgeAccount) => Promise<void>
  handleClearLogs: () => Promise<void>
  handleSendLogs: () => void
  lockSettings: () => void
  onTogglePinLoginEnabled: (enableLogin: boolean) => Promise<void>
  onToggleContactsPermissionOn: (contactsPermissionOn: boolean) => Promise<void>
  setAutoLogoutTimeInSeconds: (autoLogoutTimeInSeconds: number) => Promise<void>
  showRestoreWalletsModal: (navigation: NavigationBase) => Promise<void>
  showUnlockSettingsModal: () => Promise<void>
  toggleDeveloperMode: (developerModeOn: boolean) => void
  toggleSpamFilter: (spamFilterOn: boolean) => void
  logoutRequest: (navigation: NavigationBase) => Promise<void>
}
type Props = StateProps & DispatchProps & OwnProps & ThemeProps

interface State {
  touchIdText: string
  darkTheme: boolean
  defaultLogLevel: EdgeLogType | 'silent'
}

export class SettingsSceneComponent extends React.Component<Props, State> {
  cleanups: Array<() => unknown> = []

  constructor(props: Props) {
    super(props)

    const { logSettings } = this.props.context
    this.state = {
      touchIdText: lstrings.settings_button_use_touchID,
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

    if (Platform.OS === 'ios') {
      const biometryType = await getSupportedBiometryType()
      switch (biometryType) {
        case 'FaceID':
          this.setState({ touchIdText: lstrings.settings_button_use_faceID })
          break
        case 'TouchID':
          this.setState({ touchIdText: lstrings.settings_button_use_touchID })
          break

        case false:
          break
      }
    } else {
      this.setState({ touchIdText: lstrings.settings_button_use_biometric })
    }
  }

  handleUnlock = (): void => {
    if (!this.props.isLocked) {
      this.props.lockSettings()
    } else {
      this.props.showUnlockSettingsModal().catch(err => showError(err))
    }
  }

  handleChangePassword = (): void => {
    const { navigation } = this.props
    this.props.isLocked ? this.handleUnlock() : navigation.navigate('changePassword', {})
  }

  handleChangePin = (): void => {
    const { navigation } = this.props
    this.props.isLocked ? this.handleUnlock() : navigation.navigate('changePin', {})
  }

  handleChangeOtp = (): void => {
    const { navigation } = this.props
    this.props.isLocked ? this.handleUnlock() : navigation.navigate('otpSetup', {})
  }

  handleChangeRecovery = (): void => {
    const { navigation } = this.props
    this.props.isLocked ? this.handleUnlock() : navigation.navigate('passwordRecovery', {})
  }

  handleDeleteAccount = async (): Promise<void> => {
    if (this.props.isLocked) return this.handleUnlock()

    const approveDelete = await Airship.show<boolean>(bridge => (
      <ConfirmContinueModal
        bridge={bridge}
        body={sprintf(lstrings.delete_account_body, config.appName, config.supportSite)}
        title={lstrings.delete_account_title}
        isSkippable
        warning
      />
    ))

    if (!approveDelete) return

    const { username, rootLoginId } = this.props.account
    await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        submitLabel={lstrings.string_delete}
        message={sprintf(lstrings.delete_account_verification_body, username)}
        title={lstrings.delete_account_title}
        warning
        autoCorrect={false}
        autoCapitalize="none"
        onSubmit={async text => {
          if (text !== username) return lstrings.delete_account_verification_error
          await this.props.account.deleteRemoteAccount()
          await this.props.logoutRequest(this.props.navigation)
          await this.props.context.forgetAccount(rootLoginId)
          Airship.show(bridge => <TextDropdown bridge={bridge} message={sprintf(lstrings.delete_account_feedback, username)} />).catch(err => showError(err))
          return true
        }}
      />
    ))
  }

  handleExchangeSettings = (): void => {
    const { navigation } = this.props
    navigation.navigate('exchangeSettings', {})
  }

  handleSpendingLimits = (): void => {
    const { navigation } = this.props
    navigation.navigate('spendingLimits', {})
  }

  handleAutoLogout = (): void => {
    Airship.show<number | undefined>(bridge => <AutoLogoutModal autoLogoutTimeInSeconds={this.props.autoLogoutTimeInSeconds} bridge={bridge} />)
      .then(result => {
        if (typeof result === 'number') {
          return this.props.setAutoLogoutTimeInSeconds(result)
        }
      })
      .catch(err => showError(err))
  }

  handleDefaultFiat = (): void => {
    const { navigation } = this.props
    navigation.navigate('defaultFiatSetting', {})
  }

  handlePromotionSettings = (): void => {
    const { navigation } = this.props
    navigation.navigate('promotionSettings', {})
  }

  handleContactsAccessToggle = async (): Promise<void> => {
    await this.props.onToggleContactsPermissionOn(!this.props.contactsPermissionOn)
  }

  handlePinToggle = async (): Promise<void> => {
    await this.props.onTogglePinLoginEnabled(!this.props.pinLoginEnabled)
  }

  handleTouchIdToggle = async (): Promise<void> => {
    await this.props.dispatchUpdateEnableTouchIdEnable(!this.props.touchIdEnabled, this.props.account)
  }

  handleNotificationSettings = (): void => {
    const { navigation } = this.props
    navigation.navigate('notificationSettings', {})
  }

  handleSpamToggle = async (): Promise<void> => {
    this.props.toggleSpamFilter(!this.props.spamFilterOn)
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
    navigation.navigate('webView', { title: lstrings.title_terms_of_service, uri: config.termsOfServiceSite })
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

  handleUpgrade = (): void => {
    const { navigation } = this.props
    showBackupModal({ navigation })
  }

  render() {
    const { account, contactsPermissionOn, isLocked, navigation, theme, username, handleClearLogs, handleSendLogs } = this.props
    const iconSize = theme.rem(1.25)

    const autoLogout = secondsToDisplay(this.props.autoLogoutTimeInSeconds)
    const timeStrings = {
      seconds: lstrings.settings_seconds,
      minutes: lstrings.settings_minutes,
      hours: lstrings.settings_hours,
      days: lstrings.settings_days
    }
    const autoLogoutRightText = autoLogout.value === 0 ? lstrings.string_disable : `${autoLogout.value} ${timeStrings[autoLogout.measurement]}`
    const isLightAccount = username == null

    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <ScrollView>
          <SettingsHeaderRow
            icon={<FontAwesomeIcon color={theme.icon} name="user-o" size={iconSize} />}
            label={`${lstrings.settings_account_title_cap}: ${username ?? lstrings.missing_username}`}
          />
          {isLightAccount ? (
            <SettingsTappableRow label={lstrings.backup_account} onPress={this.handleUpgrade} />
          ) : (
            <>
              <SettingsTappableRow
                action={isLocked ? 'lock' : 'unlock'}
                label={isLocked ? lstrings.settings_button_unlock_settings : lstrings.settings_button_lock_settings}
                onPress={this.handleUnlock}
              />
              <SettingsTappableRow disabled={this.props.isLocked} label={lstrings.settings_button_change_password} onPress={this.handleChangePassword} />
              <SettingsTappableRow disabled={this.props.isLocked} label={lstrings.settings_button_pin} onPress={this.handleChangePin} />
              <SettingsTappableRow disabled={this.props.isLocked} label={lstrings.settings_button_setup_two_factor} onPress={this.handleChangeOtp} />
              <SettingsTappableRow disabled={this.props.isLocked} label={lstrings.settings_button_password_recovery} onPress={this.handleChangeRecovery} />
              <SettingsTappableRow disabled={this.props.isLocked} dangerous label={lstrings.delete_account_title} onPress={this.handleDeleteAccount} />
            </>
          )}

          <SettingsHeaderRow icon={<IonIcon color={theme.icon} name="ios-options" size={iconSize} />} label={lstrings.settings_options_title_cap} />
          {config.disableSwaps !== true ? <SettingsTappableRow label={lstrings.settings_exchange_settings} onPress={this.handleExchangeSettings} /> : null}
          <SettingsTappableRow label={lstrings.spending_limits} onPress={this.handleSpendingLimits} />
          <SettingsLabelRow right={autoLogoutRightText} label={lstrings.settings_title_auto_logoff} onPress={this.handleAutoLogout} />
          <SettingsLabelRow right={this.props.defaultFiat.replace('iso:', '')} label={lstrings.settings_title_currency} onPress={this.handleDefaultFiat} />

          {isLightAccount ? null : (
            <SettingsSwitchRow key="pinRelogin" label={lstrings.settings_title_pin_login} value={this.props.pinLoginEnabled} onPress={this.handlePinToggle} />
          )}
          {this.props.supportsTouchId && !isLightAccount && (
            <SettingsSwitchRow key="useTouchID" label={this.state.touchIdText} value={this.props.touchIdEnabled} onPress={this.handleTouchIdToggle} />
          )}

          <SettingsSwitchRow
            label={lstrings.settings_button_contacts_access_permission}
            value={contactsPermissionOn}
            onPress={this.handleContactsAccessToggle}
          />
          <SettingsSwitchRow
            key="spamFilter"
            label={lstrings.settings_hide_spam_transactions}
            value={this.props.spamFilterOn}
            onPress={this.handleSpamToggle}
          />
          <SettingsTappableRow label={lstrings.settings_notifications} onPress={this.handleNotificationSettings} />
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
                <CryptoIcon marginRem={[0.5, 0, 0.5, 0.5]} pluginId={pluginId} sizeRem={1.25} />
              </SettingsTappableRow>
            )
          })}

          <SettingsTappableRow label={lstrings.title_promotion_settings} onPress={this.handlePromotionSettings} />
          {ENV.ALLOW_DEVELOPER_MODE && (
            <SettingsSwitchRow
              key="developerMode"
              label={lstrings.settings_developer_mode}
              value={this.props.developerModeOn}
              onPress={this.handleDeveloperToggle}
            />
          )}
          {this.props.developerModeOn && (
            <SettingsSwitchRow key="darkTheme" label={lstrings.settings_dark_theme} value={this.state.darkTheme} onPress={this.handleDarkThemeToggle} />
          )}
          <SettingsTappableRow label={lstrings.restore_wallets_modal_title} onPress={async () => await this.props.showRestoreWalletsModal(navigation)} />
          <SettingsTappableRow label={lstrings.migrate_wallets_title} onPress={() => navigation.push('migrateWalletSelectCrypto', {})} />
          <SettingsTappableRow label={lstrings.title_terms_of_service} onPress={this.handleTermsOfService} />
          <SettingsSwitchRow
            key="verboseLogging"
            label={lstrings.settings_verbose_logging}
            value={this.state.defaultLogLevel === 'info'}
            onPress={this.handleVerboseLoggingToggle}
          />
          <Space around={2}>
            <MainButton alignSelf="center" label={lstrings.settings_button_export_logs} type="secondary" onPress={handleSendLogs} />
            <MainButton alignSelf="center" label={lstrings.settings_button_clear_logs} marginRem={[1, 0, 0, 0]} type="escape" onPress={handleClearLogs} />
          </Space>
        </ScrollView>
      </SceneWrapper>
    )
  }
}

export const SettingsScene = (props: OwnProps) => {
  const { navigation, route } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)
  const autoLogoutTimeInSeconds = useSelector(state => state.ui.settings.autoLogoutTimeInSeconds)
  const contactsPermissionOn = useSelector(state => state.ui.settings.contactsPermissionOn)
  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const developerModeOn = useSelector(state => state.ui.settings.developerModeOn)
  const spamFilterOn = useSelector(state => state.ui.settings.spamFilterOn)
  const isLocked = useSelector(state => state.ui.settings.changesLocked)
  const pinLoginEnabled = useSelector(state => state.ui.settings.pinLoginEnabled)
  const supportsTouchId = useSelector(state => state.ui.settings.isTouchSupported)
  const touchIdEnabled = useSelector(state => state.ui.settings.isTouchEnabled)

  const username = useWatch(account, 'username')

  const handleDispatchUpdateEnableTouchIdEnable = useHandler(async (arg: boolean, account: EdgeAccount) => {
    await dispatch(updateTouchIdEnabled(arg, account))
  })
  const handleClearLogs = useHandler(async () => {
    await dispatch(showClearLogsModal())
  })
  const handleSendLogs = useHandler(async () => {
    await dispatch(showSendLogsModal())
  })
  const handleLockSettings = useHandler(() => {
    dispatch({
      type: 'UI/SETTINGS/SET_SETTINGS_LOCK',
      data: true
    })
  })
  const handleTogglePinLoginEnabled = useHandler(async (enableLogin: boolean) => {
    await dispatch(togglePinLoginEnabled(enableLogin))
  })
  const handleSetAutoLogoutTimeInSeconds = useHandler(async (autoLogoutTimeInSeconds: number) => {
    await dispatch(setAutoLogoutTimeInSecondsRequest(autoLogoutTimeInSeconds))
  })
  const handleShowRestoreWalletsModal = useHandler(async (navigation: NavigationBase) => {
    await dispatch(showRestoreWalletsModal(navigation))
  })
  const handleShowUnlockSettingsModal = useHandler(async () => {
    await dispatch(showUnlockSettingsModal())
  })
  const handleToggleDeveloperMode = useHandler(async (developerModeOn: boolean) => {
    dispatch(setDeveloperModeOn(developerModeOn))
  })
  const handleToggleSpamFilter = useHandler((spamFilterOn: boolean) => {
    dispatch(setSpamFilterOn(spamFilterOn))
  })
  const handleLogoutRequest = useHandler(async (navigation: NavigationBase) => {
    await dispatch(logoutRequest(navigation))
  })
  const handleToggleContactsPermission = useHandler(async (contactsPermissionOn: boolean) => {
    await dispatch(setContactsPermissionOn(contactsPermissionOn))
  })

  return (
    <SettingsSceneComponent
      navigation={navigation}
      route={route}
      theme={theme}
      account={account}
      autoLogoutTimeInSeconds={autoLogoutTimeInSeconds}
      contactsPermissionOn={contactsPermissionOn}
      context={context}
      defaultFiat={defaultFiat}
      developerModeOn={developerModeOn}
      isLocked={isLocked}
      pinLoginEnabled={pinLoginEnabled}
      spamFilterOn={spamFilterOn}
      supportsTouchId={supportsTouchId}
      touchIdEnabled={touchIdEnabled}
      username={username}
      dispatchUpdateEnableTouchIdEnable={handleDispatchUpdateEnableTouchIdEnable}
      handleClearLogs={handleClearLogs}
      handleSendLogs={handleSendLogs}
      lockSettings={handleLockSettings}
      onTogglePinLoginEnabled={handleTogglePinLoginEnabled}
      onToggleContactsPermissionOn={handleToggleContactsPermission}
      setAutoLogoutTimeInSeconds={handleSetAutoLogoutTimeInSeconds}
      showRestoreWalletsModal={handleShowRestoreWalletsModal}
      showUnlockSettingsModal={handleShowUnlockSettingsModal}
      toggleDeveloperMode={handleToggleDeveloperMode}
      toggleSpamFilter={handleToggleSpamFilter}
      logoutRequest={handleLogoutRequest}
    />
  )
}
