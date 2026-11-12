import type { EdgeAccount } from 'edge-core-js'
import {
  type ContactSupportInfo,
  type InitialRouteName,
  LoginScreen
} from 'edge-login-ui-rn'
import * as React from 'react'
import { Keyboard, StatusBar, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { getDeviceSettings } from '../../actions/DeviceSettingsActions'
import { showSendLogsModal } from '../../actions/LogActions'
import { initializeAccount } from '../../actions/LoginActions'
import {
  cacheStyles,
  type Theme,
  useTheme
} from '../../components/services/ThemeContext'
import { CONFIG } from '../../config'
import type { ExperimentConfig } from '../../experimentConfig'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { performanceMarkersFromLoginUiPerfEvents } from '../../perf'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { NavigationBase, RootSceneProps } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import { makeYoloOtpOptions, type YoloOtpOptions } from '../../util/yoloLogin'
import { DotsBackground } from '../common/DotsBackground'
import { showHelpModal } from '../modals/HelpModal'
import { showIntercomChatModal } from '../modals/IntercomChatModal'
import { showDevError, showError } from '../services/AirshipInstance'
import { LoadingScene } from './LoadingScene'

export interface LoginParams {
  passwordRecoveryKey?: string
  nextLoginId?: string
  experimentConfig: ExperimentConfig // TODO: Create a new provider instead to serve the experimentConfig globally
  loginUiInitialRoute?: InitialRouteName
}

interface Props extends RootSceneProps<'login'> {}

let firstRun = true

export const LoginScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const {
    experimentConfig,
    loginUiInitialRoute = 'login',
    nextLoginId,
    passwordRecoveryKey
  } = route.params
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------

  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)
  const loggedIn = useWatch(account, 'loggedIn')

  // ---------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------

  React.useEffect(() => {
    if (!firstRun) return
    // The core context is an empty placeholder object until EdgeCoreManager
    // finishes booting. On release builds this scene mounts first, so bail
    // WITHOUT disarming firstRun; the context dep re-runs this effect once
    // the real context lands, and YOLO can fire then.
    if (context.loginWithPassword == null) return
    const { YOLO_USERNAME, YOLO_PASSWORD, YOLO_PIN, YOLO_OTP_KEY } = CONFIG

    const yoloLogin = (login: () => Promise<EdgeAccount>): void => {
      firstRun = false
      login()
        .then(async account => {
          await dispatch(initializeAccount(navigation, account))
        })
        .catch((error: unknown) => {
          showError(error)
        })
    }

    const hasPassword = YOLO_PASSWORD != null && YOLO_PASSWORD !== ''
    const hasPin = YOLO_PIN != null && YOLO_PIN !== ''

    if (YOLO_USERNAME != null && hasPassword) {
      // Password login is the only method that works without a login stash, so
      // it wins when both it and a PIN are configured. Running both would start
      // two separate accounts and race their navigations:
      //
      // It is also the only method the OTP key is any use to. PIN login needs
      // a stash, and a stash that can do PIN login already carries the account
      // `otpKey` for `getStashOtp` to find, so passing one here would only
      // override that with whatever the setting happens to hold. Resolve the
      // key up front so a malformed one reports itself instead of failing
      // later as an `OtpError`:
      let otpOptions: YoloOtpOptions
      try {
        otpOptions = makeYoloOtpOptions(YOLO_OTP_KEY)
      } catch (error: unknown) {
        firstRun = false
        showError(error)
        return
      }
      yoloLogin(
        async () =>
          await context.loginWithPassword(
            YOLO_USERNAME,
            YOLO_PASSWORD,
            otpOptions
          )
      )
    } else if (YOLO_USERNAME != null && hasPin) {
      yoloLogin(async () => await context.loginWithPIN(YOLO_USERNAME, YOLO_PIN))
    } else if (
      YOLO_USERNAME == null &&
      hasPin &&
      account.username == null &&
      context.localUsers[0]?.loginId != null
    ) {
      // Allow YOLO_PIN with light accounts
      yoloLogin(
        async () =>
          await context.loginWithPIN(context.localUsers[0].loginId, YOLO_PIN, {
            useLoginId: true
          })
      )
    }
  }, [account, context, dispatch, navigation])

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------

  const parentButton = React.useMemo(
    () => ({
      callback() {
        Keyboard.dismiss()
        showHelpModal(navigation as NavigationBase).catch((error: unknown) => {
          showDevError(error)
        })
      },
      text: lstrings.string_help
    }),
    [navigation]
  )

  const maybeHandleComplete = CONFIG.USE_WELCOME_SCREENS
    ? () => {
        navigation.replace('gettingStarted', { experimentConfig })
      }
    : undefined

  const handleLogin = useHandler((account: EdgeAccount) => {
    dispatch(initializeAccount(navigation, account)).catch((error: unknown) => {
      showError(error)
    })
  })

  const handleSendLogs = useHandler(() => {
    dispatch(showSendLogsModal()).catch((error: unknown) => {
      showError(error)
    })
  })

  const handleLogEvent = useHandler((event, values) => {
    dispatch(logEvent(event, values))
  })

  const handlePerfEvent = useHandler(event => {
    performanceMarkersFromLoginUiPerfEvents(event)
  })

  // A second tap while the chat is open must not send the message again:
  const isChatOpen = React.useRef(false)
  // Reopening the chat shows the message already sent, so it goes out once:
  const sentMessage = React.useRef<string | undefined>(undefined)

  const handleContactSupport = useHandler(
    async (info: ContactSupportInfo): Promise<void> => {
      const { intercomApiBase, intercomAppId, supportChatSite } = config
      if (intercomAppId == null || supportChatSite == null) return
      if (isChatOpen.current) return
      isChatOpen.current = true
      const { lockId } = info
      const message =
        lockId == null
          ? lstrings.help_live_chat_authorize_device
          : sprintf(lstrings.help_live_chat_authorize_device_1s, lockId)
      const isNewMessage = message !== sentMessage.current
      sentMessage.current = message
      try {
        await showIntercomChatModal({
          appId: intercomAppId,
          apiBase: intercomApiBase,
          siteUri: supportChatSite,
          lockId,
          message: isNewMessage ? message : undefined
        })
      } finally {
        isChatOpen.current = false
      }
    }
  )

  // Without an Intercom workspace, Login UI opens its own support article:
  const hasSupportChat =
    config.intercomAppId != null && config.supportChatSite != null

  return loggedIn ? (
    <LoadingScene />
  ) : (
    <View style={styles.container} testID="edge: login-scene">
      <DotsBackground />
      <LoginScreen
        accountOptions={accountOptions}
        appConfig={config}
        appId={config.appId}
        appName={config.appNameShort}
        context={context}
        experimentConfig={experimentConfig}
        fastLogin
        forceLightAccountCreate={getDeviceSettings().forceLightAccountCreate}
        initialLoginId={nextLoginId}
        initialRoute={loginUiInitialRoute}
        parentButton={parentButton}
        primaryLogo={theme.primaryLogo}
        primaryLogoCallback={handleSendLogs}
        recoveryLogin={passwordRecoveryKey}
        onComplete={maybeHandleComplete}
        onContactSupport={hasSupportChat ? handleContactSupport : undefined}
        onLogEvent={handleLogEvent}
        onLogin={handleLogin}
        onPerfEvent={handlePerfEvent}
      />
    </View>
  )
}

const accountOptions = {
  pauseWallets: true
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight
  }
}))
