import { EdgeLogType } from 'edge-core-js'
import { getSupportedBiometryType } from 'edge-login-ui-rn'
import * as React from 'react'
import { Platform } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { showBackupModal } from '../../actions/BackupModalActions'
import { getDeviceSettings, writeDisableAnimations, writeForceLightAccountCreate } from '../../actions/DeviceSettingsActions'
import { setContactsPermissionOn, setDeveloperModeOn, setSpamFilterOn } from '../../actions/LocalSettingsActions'
import { showClearLogsModal, showSendLogsModal } from '../../actions/LogActions'
import { logoutRequest } from '../../actions/LoginActions'
import {
  setAutoLogoutTimeInSecondsRequest,
  showReEnableOtpModal,
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
import { useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { secondsToDisplay } from '../../util/displayTime'
import { removeIsoPrefix } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { TextDropdown } from '../common/TextDropdown'
import { SectionView } from '../layout/SectionView'
import { AutoLogoutModal } from '../modals/AutoLogoutModal'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { changeTheme, useTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsLabelRow } from '../settings/SettingsLabelRow'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { SettingsTappableRow } from '../settings/SettingsTappableRow'

interface Props extends EdgeSceneProps<'settingsOverview'> {}

export const SettingsScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  const autoLogoutTimeInSeconds = useSelector(state => state.ui.settings.autoLogoutTimeInSeconds)
  const contactsPermissionOn = useSelector(state => state.ui.settings.contactsPermissionOn)
  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const developerModeOn = useSelector(state => state.ui.settings.developerModeOn)
  const isLocked = useSelector(state => state.ui.settings.changesLocked)
  const pinLoginEnabled = useSelector(state => state.ui.settings.pinLoginEnabled)
  const spamFilterOn = useSelector(state => state.ui.settings.spamFilterOn)
  const supportsTouchId = useSelector(state => state.ui.settings.isTouchSupported)
  const touchIdEnabled = useSelector(state => state.ui.settings.isTouchEnabled)

  const account = useSelector(state => state.core.account)
  const username = useWatch(account, 'username')

  const context = useSelector(state => state.core.context)
  const logSettings = useWatch(context, 'logSettings')

  const [isDarkTheme, setIsDarkTheme] = React.useState(theme === config.darkTheme)
  const [defaultLogLevel, setDefaultLogLevel] = React.useState<EdgeLogType | 'silent'>(logSettings.defaultLogLevel)
  const [disableAnim, setDisableAnim] = useState<boolean>(getDeviceSettings().disableAnimations)
  const [forceLightAccountCreate, setForceLightAccountCreate] = useState<boolean>(getDeviceSettings().forceLightAccountCreate)
  const [touchIdText, setTouchIdText] = React.useState(lstrings.settings_button_use_touchID)

  const iconSize = theme.rem(1.25)
  const isLightAccount = username == null

  const autoLogout = secondsToDisplay(autoLogoutTimeInSeconds)
  const timeStrings = {
    seconds: lstrings.settings_seconds,
    minutes: lstrings.settings_minutes,
    hours: lstrings.settings_hours,
    days: lstrings.settings_days
  }
  const autoLogoutRightText = autoLogout.value === 0 ? lstrings.string_disable : `${autoLogout.value} ${timeStrings[autoLogout.measurement]}`

  const handleUpgrade = useHandler(() => {
    showBackupModal({ navigation })
  })

  const handleUnlock = useHandler(() => {
    if (!isLocked) {
      dispatch({
        type: 'UI/SETTINGS/SET_SETTINGS_LOCK',
        data: true
      })
    } else {
      handleShowUnlockSettingsModal().catch(err => showError(err))
    }
  })

  const handleUpdateTouchId = useHandler(async () => {
    await dispatch(updateTouchIdEnabled(!touchIdEnabled, account))
  })

  const handleClearLogs = useHandler(async () => {
    await dispatch(showClearLogsModal())
  })

  const handleSendLogs = useHandler(async () => {
    await dispatch(showSendLogsModal())
  })

  const handleTogglePinLoginEnabled = useHandler(async () => {
    await dispatch(togglePinLoginEnabled(!pinLoginEnabled))
  })

  const handleToggleDarkTheme = useHandler(async () => {
    setIsDarkTheme(!isDarkTheme)
    !isDarkTheme ? changeTheme(config.darkTheme) : changeTheme(config.lightTheme)
  })

  const handleSetAutoLogoutTime = useHandler(async () => {
    const newAutoLogoutTimeInSeconds = await Airship.show<number | undefined>(bridge => (
      <AutoLogoutModal autoLogoutTimeInSeconds={autoLogoutTimeInSeconds} bridge={bridge} />
    ))
    if (typeof newAutoLogoutTimeInSeconds === 'number') {
      await dispatch(setAutoLogoutTimeInSecondsRequest(newAutoLogoutTimeInSeconds))
    }
  })

  const handleDefaultFiat = useHandler(() => {
    navigation.navigate('defaultFiatSetting', {})
  })

  const handleShowRestoreWalletsModal = useHandler(async () => {
    await dispatch(showRestoreWalletsModal(navigation))
  })

  const handleShowUnlockSettingsModal = useHandler(async () => {
    await dispatch(showUnlockSettingsModal())
  })

  const handleToggleDisableAnimations = useHandler(async () => {
    const newDisableAnim = !disableAnim
    setDisableAnim(newDisableAnim)
    await writeDisableAnimations(newDisableAnim)
  })

  const handleToggleSpamFilter = useHandler(() => {
    dispatch(setSpamFilterOn(!spamFilterOn))
  })

  const handleChangePassword = useHandler((): void => {
    isLocked ? handleUnlock() : navigation.navigate('changePassword', {})
  })

  const handleChangePin = useHandler((): void => {
    isLocked ? handleUnlock() : navigation.navigate('changePin', {})
  })

  const handleChangeOtp = useHandler((): void => {
    isLocked ? handleUnlock() : navigation.navigate('otpSetup', {})
  })

  const handleChangeRecovery = useHandler((): void => {
    isLocked ? handleUnlock() : navigation.navigate('passwordRecovery', {})
  })

  const handleDeleteAccount = useHandler(async () => {
    if (isLocked) {
      handleUnlock()
      return
    }

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

    const { username, rootLoginId } = account
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
          await account.deleteRemoteAccount()
          await dispatch(logoutRequest(navigation))
          await context.forgetAccount(rootLoginId)
          Airship.show(bridge => <TextDropdown bridge={bridge} message={sprintf(lstrings.delete_account_feedback, username)} />).catch(err => showError(err))
          return true
        }}
      />
    ))
  })

  const handleExchangeSettings = useHandler((): void => {
    navigation.navigate('swapSettings', {})
  })

  const handleSpendingLimits = useHandler((): void => {
    navigation.navigate('spendingLimits', {})
  })

  const handleTermsOfService = useHandler(() => {
    navigation.navigate('webView', { title: lstrings.title_terms_of_service, uri: config.termsOfServiceSite })
  })

  const handleToggleContactsPermission = useHandler(async () => {
    await dispatch(setContactsPermissionOn(!contactsPermissionOn))
  })

  const handleNotificationSettings = useHandler(() => {
    navigation.navigate('notificationSettings', {})
  })

  const handlePromotionSettings = useHandler(() => {
    navigation.navigate('promotionSettings', {})
  })

  const handleToggleVerboseLogging = useHandler(() => {
    const newDefaultLogLevel = defaultLogLevel === 'info' ? 'warn' : 'info'
    setDefaultLogLevel(newDefaultLogLevel)
    context
      .changeLogSettings({
        defaultLogLevel: newDefaultLogLevel,
        sources: {}
      })
      .catch(error => showError(error))
  })

  // Developer settings:
  const handleToggleDeveloperMode = useHandler(async () => {
    await dispatch(setDeveloperModeOn(!developerModeOn))
  })
  const handleToggleForceLightAccountCreate = useHandler(async () => {
    setForceLightAccountCreate(!forceLightAccountCreate)
    await writeForceLightAccountCreate(!forceLightAccountCreate)
  })

  const loadBiometryType = async () => {
    if (Platform.OS === 'ios') {
      const biometryType = await getSupportedBiometryType()
      switch (biometryType) {
        case 'FaceID':
          setTouchIdText(lstrings.settings_button_use_faceID)
          break
        case 'TouchID':
          setTouchIdText(lstrings.settings_button_use_touchID)
          break

        case false:
          break
      }
    } else {
      setTouchIdText(lstrings.settings_button_use_biometric)
    }
  }

  // Load biometry type on mount
  React.useEffect(() => {
    if (!supportsTouchId) return

    loadBiometryType().catch(error => showError(error))

    // Watch for logSettings changes
    const cleanup = context.watch('logSettings', logSettings => {
      setDefaultLogLevel(logSettings.defaultLogLevel)
    })

    // Cleanup function to remove the watcher on unmount
    return () => {
      if (cleanup) cleanup()
    }
  }, [context, supportsTouchId])

  // Show a modal if we have a pending OTP resent when we enter the scene:
  React.useEffect(() => {
    return navigation.addListener('focus', () => {
      if (account.otpResetDate != null) {
        showReEnableOtpModal(account).catch(error => showError(error))
      }
    })
  }, [account, navigation])

  return (
    <SceneWrapper scroll>
      <SectionView extendRight marginRem={0.5}>
        <>
          <SettingsHeaderRow
            icon={<FontAwesomeIcon color={theme.icon} name="user-o" size={iconSize} />}
            label={`${lstrings.settings_account_title_cap}: ${username ?? lstrings.missing_username}`}
          />
          {isLightAccount ? (
            <EdgeCard>
              <SettingsTappableRow label={lstrings.backup_account} onPress={handleUpgrade} />
            </EdgeCard>
          ) : (
            <EdgeCard sections>
              <SettingsTappableRow
                action={isLocked ? 'lock' : 'unlock'}
                label={isLocked ? lstrings.settings_button_unlock_settings : lstrings.settings_button_lock_settings}
                onPress={handleUnlock}
              />
              <SettingsTappableRow disabled={isLocked} label={lstrings.settings_button_change_password} onPress={handleChangePassword} />
              <SettingsTappableRow disabled={isLocked} label={lstrings.settings_button_pin} onPress={handleChangePin} />
              <SettingsTappableRow disabled={isLocked} label={lstrings.settings_button_setup_two_factor} onPress={handleChangeOtp} />
              <SettingsTappableRow disabled={isLocked} label={lstrings.settings_button_password_recovery} onPress={handleChangeRecovery} />
              <SettingsTappableRow disabled={isLocked} dangerous label={lstrings.delete_account_title} onPress={handleDeleteAccount} />
            </EdgeCard>
          )}
        </>
        <>
          <SettingsHeaderRow icon={<IonIcon color={theme.icon} name="options" size={iconSize} />} label={lstrings.settings_options_title_cap} />
          <EdgeCard sections>
            {config.disableSwaps !== true ? <SettingsTappableRow label={lstrings.settings_exchange_settings} onPress={handleExchangeSettings} /> : null}
            <SettingsTappableRow label={lstrings.spending_limits} onPress={handleSpendingLimits} />
            <SettingsLabelRow right={autoLogoutRightText} label={lstrings.settings_title_auto_logoff} onPress={handleSetAutoLogoutTime} />
            <SettingsLabelRow right={removeIsoPrefix(defaultFiat)} label={lstrings.settings_title_currency} onPress={handleDefaultFiat} />

            {isLightAccount ? null : (
              <SettingsSwitchRow key="pinRelogin" label={lstrings.settings_title_pin_login} value={pinLoginEnabled} onPress={handleTogglePinLoginEnabled} />
            )}
            {supportsTouchId && !isLightAccount && (
              <SettingsSwitchRow key="useTouchID" label={touchIdText} value={touchIdEnabled} onPress={handleUpdateTouchId} />
            )}

            <SettingsSwitchRow
              label={lstrings.settings_button_contacts_access_permission}
              value={contactsPermissionOn}
              onPress={handleToggleContactsPermission}
            />
            <SettingsSwitchRow key="spamFilter" label={lstrings.settings_hide_spam_transactions} value={spamFilterOn} onPress={handleToggleSpamFilter} />
            <SettingsTappableRow label={lstrings.settings_notifications} onPress={handleNotificationSettings} />
            <SettingsTappableRow
              label={lstrings.settings_asset_settings}
              onPress={() => navigation.push('assetSettings', { currencySettingsKeys: CURRENCY_SETTINGS_KEYS })}
            />
            <SettingsTappableRow label={lstrings.title_promotion_settings} onPress={handlePromotionSettings} />

            <SettingsSwitchRow key="disableAnim" label={lstrings.button_disable_animations} value={disableAnim} onPress={handleToggleDisableAnimations} />
            <SettingsTappableRow label={lstrings.restore_wallets_modal_title} onPress={handleShowRestoreWalletsModal} />
            <SettingsTappableRow label={lstrings.migrate_wallets_title} onPress={() => navigation.push('migrateWalletSelectCrypto', {})} />
            <SettingsTappableRow label={lstrings.title_terms_of_service} onPress={handleTermsOfService} />
            <SettingsSwitchRow
              key="verboseLogging"
              label={lstrings.settings_verbose_logging}
              value={defaultLogLevel === 'info'}
              onPress={handleToggleVerboseLogging}
            />
          </EdgeCard>
        </>
        {ENV.ALLOW_DEVELOPER_MODE && (
          <EdgeCard sections>
            <SettingsSwitchRow key="developerMode" label={lstrings.settings_developer_mode} value={developerModeOn} onPress={handleToggleDeveloperMode} />

            {developerModeOn && [
              <SettingsSwitchRow key="darkTheme" label={lstrings.settings_dark_theme} value={isDarkTheme} onPress={handleToggleDarkTheme} />,
              <SettingsSwitchRow
                key="forceLightAccount"
                label={lstrings.settings_developer_options_force_la}
                value={forceLightAccountCreate}
                onPress={handleToggleForceLightAccountCreate}
              />
            ]}
          </EdgeCard>
        )}
      </SectionView>
      <ButtonsView
        layout="column"
        primary={{
          onPress: handleSendLogs,
          label: lstrings.settings_button_export_logs
        }}
        secondary={{
          onPress: handleClearLogs,
          label: lstrings.settings_button_clear_logs
        }}
      />
    </SceneWrapper>
  )
}
