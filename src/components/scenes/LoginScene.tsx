import type { EdgeAccount } from 'edge-core-js'
import { type InitialRouteName, LoginScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { Keyboard, StatusBar, View } from 'react-native'
import { BlurView } from 'rn-id-blurview'

import { getDeviceSettings } from '../../actions/DeviceSettingsActions'
import { showSendLogsModal } from '../../actions/LogActions'
import { initializeAccount } from '../../actions/LoginActions'
import {
  cacheStyles,
  type Theme,
  useTheme
} from '../../components/services/ThemeContext'
import { ENV } from '../../env'
import type { ExperimentConfig } from '../../experimentConfig'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { performanceMarkersFromLoginUiPerfEvents } from '../../perf'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { NavigationBase, RootSceneProps } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import { DotsBackground } from '../common/DotsBackground'
import { showHelpModal } from '../modals/HelpModal'
import { showDevError, showError } from '../services/AirshipInstance'
import { LoadingScene } from './LoadingScene'

export interface LoginParams {
  passwordRecoveryKey?: string
  nextLoginId?: string
  experimentConfig: ExperimentConfig // TODO: Create a new provider instead to serve the experimentConfig globally
  loginUiInitialRoute?: InitialRouteName
}

// @ts-expect-error Sneak the BlurView over to the login UI:
global.ReactNativeBlurView = BlurView

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
    const { YOLO_USERNAME, YOLO_PASSWORD, YOLO_PIN } = ENV
    if (
      YOLO_USERNAME != null &&
      (Boolean(YOLO_PASSWORD) || Boolean(YOLO_PIN))
    ) {
      firstRun = false
      if (YOLO_PIN != null) {
        context
          .loginWithPIN(YOLO_USERNAME, YOLO_PIN)
          .then(async account => {
            await dispatch(
              initializeAccount(navigation as NavigationBase, account)
            )
          })
          .catch((error: unknown) => {
            showError(error)
          })
      }
      if (YOLO_PASSWORD != null) {
        context
          .loginWithPassword(YOLO_USERNAME, YOLO_PASSWORD)
          .then(async account => {
            await dispatch(
              initializeAccount(navigation as NavigationBase, account)
            )
          })
          .catch((error: unknown) => {
            showError(error)
          })
      }
    } else if (
      YOLO_USERNAME == null &&
      account.username == null &&
      context.localUsers[0]?.loginId != null &&
      typeof YOLO_PIN === 'string'
    ) {
      // Allow YOLO_PIN with light accounts
      firstRun = false
      context
        .loginWithPIN(context.localUsers[0].loginId, YOLO_PIN, {
          useLoginId: true
        })
        .then(async account => {
          await dispatch(
            initializeAccount(navigation as NavigationBase, account)
          )
        })
        .catch((error: unknown) => {
          showError(error)
        })
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

  const maybeHandleComplete = ENV.USE_WELCOME_SCREENS
    ? () => {
        navigation.replace('gettingStarted', { experimentConfig })
      }
    : undefined

  const handleLogin = useHandler((account: EdgeAccount) => {
    dispatch(initializeAccount(navigation as NavigationBase, account)).catch(
      (error: unknown) => {
        showError(error)
      }
    )
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
