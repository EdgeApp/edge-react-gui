import { EdgeAccount } from 'edge-core-js'
import { InitialRouteName, LoginScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { Keyboard, StatusBar, View } from 'react-native'
import { BlurView } from 'rn-id-blurview'

import { getDeviceSettings } from '../../actions/DeviceSettingsActions'
import { showSendLogsModal } from '../../actions/LogActions'
import { initializeAccount, logoutRequest } from '../../actions/LoginActions'
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
import { withServices } from '../hoc/withServices'
import { showHelpModal } from '../modals/HelpModal'
import { showError } from '../services/AirshipInstance'
import { LoadingScene } from './LoadingScene'

export interface LoginParams {
  experimentConfig: ExperimentConfig // TODO: Create a new provider instead to serve the experimentConfig globally
  loginUiInitialRoute?: InitialRouteName
}

// Sneak the BlurView over to the login UI:
// @ts-expect-error
global.ReactNativeBlurView = BlurView

interface Props extends EdgeSceneProps<'login'> {}

let firstRun = true

export function LoginSceneComponent(props: Props) {
  const { navigation, route } = props
  const { loginUiInitialRoute = 'login', experimentConfig } = route.params
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------

  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)
  const pendingDeepLink = useSelector(state => state.pendingDeepLink)
  const nextLoginId = useSelector(state => state.nextLoginId)
  const loggedIn = useWatch(account, 'loggedIn')

  const [counter, setCounter] = React.useState<number>(0)
  const [passwordRecoveryKey, setPasswordRecoveryKey] = React.useState<string | undefined>()

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

  React.useEffect(() => {
    if (pendingDeepLink != null && pendingDeepLink.type === 'passwordRecovery') {
      // Log out if necessary:
      if (account.loggedIn) {
        dispatch(logoutRequest(navigation)).catch(err => showError(err))
      }

      // Pass the link to our component:
      const { passwordRecoveryKey } = pendingDeepLink
      setPasswordRecoveryKey(passwordRecoveryKey)
      setCounter(counter => counter + 1)
      dispatch({ type: 'DEEP_LINK_HANDLED' })
    }
  }, [account, dispatch, navigation, pendingDeepLink])

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
        navigation.navigate('gettingStarted', { experimentConfig })
      }
    : undefined

  const handleLogin = useHandler(async (account: EdgeAccount) => {
    setPasswordRecoveryKey(undefined)
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
        key={String(counter)}
        accountOptions={accountOptions}
        appConfig={config}
        appId={config.appId}
        appName={config.appNameShort}
        context={context}
        experimentConfig={experimentConfig}
        fastLogin
        forceLightAccountCreate={getDeviceSettings().forceLightAccountCreate}
        initialLoginId={nextLoginId ?? undefined}
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

export const LoginScene = withServices(LoginSceneComponent)
