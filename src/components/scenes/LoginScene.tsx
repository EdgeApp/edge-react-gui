import { EdgeAccount } from 'edge-core-js'
import { InitialRouteName, LoginScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { Keyboard, StatusBar, View } from 'react-native'
import { BlurView } from 'rn-id-blurview'

import { getDeviceSettings } from '../../actions/DeviceSettingsActions'
import { showSendLogsModal } from '../../actions/LogActions'
import { initializeAccount } from '../../actions/LoginActions'
import { cacheStyles, Theme, useTheme } from '../../components/services/ThemeContext'
import { ENV } from '../../env'
import { ExperimentConfig } from '../../experimentConfig'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { performanceMarkersFromLoginUiPerfEvents } from '../../perf'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { logEvent } from '../../util/tracking'
import { DotsBackground } from '../common/DotsBackground'
import { showHelpModal } from '../modals/HelpModal'
import { showError } from '../services/AirshipInstance'
import { DeepLinkingManager } from '../services/DeepLinkingManager'
import { LoadingScene } from './LoadingScene'

export interface LoginParams {
  passwordRecoveryKey?: string
  nextLoginId?: string
  experimentConfig: ExperimentConfig // TODO: Create a new provider instead to serve the experimentConfig globally
  loginUiInitialRoute?: InitialRouteName
}

// Sneak the BlurView over to the login UI:
// @ts-expect-error
global.ReactNativeBlurView = BlurView

interface Props extends EdgeSceneProps<'login'> {}

let firstRun = true

export function LoginScene(props: Props) {
  const { navigation, route } = props
  const { experimentConfig, loginUiInitialRoute = 'login', nextLoginId, passwordRecoveryKey } = route.params
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
    if (YOLO_USERNAME != null && (Boolean(YOLO_PASSWORD) || Boolean(YOLO_PIN))) {
      firstRun = false
      if (YOLO_PIN != null) {
        context
          .loginWithPIN(YOLO_USERNAME, YOLO_PIN)
          .then(async account => {
            await dispatch(initializeAccount(navigation, account))
          })
          .catch(error => showError(error))
      }
      if (YOLO_PASSWORD != null) {
        context
          .loginWithPassword(YOLO_USERNAME, YOLO_PASSWORD)
          .then(async account => {
            await dispatch(initializeAccount(navigation, account))
          })
          .catch(error => showError(error))
      }
    } else if (YOLO_USERNAME == null && account.username == null && context.localUsers[0]?.loginId != null && typeof YOLO_PIN === 'string') {
      // Allow YOLO_PIN with light accounts
      firstRun = false
      context
        .loginWithPIN(context.localUsers[0].loginId, YOLO_PIN, { useLoginId: true })
        .then(async account => {
          await dispatch(initializeAccount(navigation, account))
        })
        .catch(error => showError(error))
    }
  }, [account, context, dispatch, navigation])

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------

  const parentButton = React.useMemo(
    () => ({
      callback() {
        Keyboard.dismiss()
        showHelpModal(navigation).catch(err => showError(err))
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

  const handleLogin = useHandler(async (account: EdgeAccount) => {
    await dispatch(initializeAccount(navigation, account))
  })

  const handleSendLogs = useHandler(() => {
    dispatch(showSendLogsModal()).catch(err => showError(err))
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
      {/* Needed to handle recovery deep links: */}
      <DeepLinkingManager navigation={navigation} />
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
