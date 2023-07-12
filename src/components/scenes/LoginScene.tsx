import { EdgeAccount } from 'edge-core-js'
import { LoginScreen } from 'edge-login-ui-rn'
import { NotificationPermissionsInfo } from 'edge-login-ui-rn/lib/types/ReduxTypes'
import * as React from 'react'
import { Keyboard, StatusBar, View } from 'react-native'
import { checkVersion } from 'react-native-check-version'
import { BlurView } from 'rn-id-blurview'

import { showSendLogsModal } from '../../actions/LogActions'
import { initializeAccount, logoutRequest } from '../../actions/LoginActions'
import { serverSettingsToNotificationSettings, setDeviceSettings } from '../../actions/NotificationActions'
import { cacheStyles, Theme, useTheme } from '../../components/services/ThemeContext'
import { ENV } from '../../env'
import { useAsyncValue } from '../../hooks/useAsyncValue'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { ImageProp } from '../../types/Theme'
import { GuiTouchIdInfo } from '../../types/types'
import { trackError } from '../../util/tracking'
import { pickRandom } from '../../util/utils'
import { withServices } from '../hoc/withServices'
import { showHelpModal } from '../modals/HelpModal'
import { UpdateModal } from '../modals/UpdateModal'
import { Airship, showError } from '../services/AirshipInstance'
import { getBackgroundImage } from './../../util/ThemeCache'
import { LoadingScene } from './LoadingScene'

// Sneak the BlurView over to the login UI:
// @ts-expect-error
global.ReactNativeBlurView = BlurView

interface Props extends EdgeSceneProps<'login'> {}

let firstRun = true

export function LoginSceneComponent(props: Props) {
  const { navigation, route } = props
  const { loginUiInitialRoute = 'login' } = route.params ?? {}
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------

  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)
  const disklet = useSelector(state => state.core.disklet)
  const pendingDeepLink = useSelector(state => state.pendingDeepLink)
  const nextUsername = useSelector(state => state.nextUsername ?? undefined)
  const loggedIn = useWatch(account, 'loggedIn')

  const [counter, setCounter] = React.useState<number>(0)
  const [notificationPermissionsInfo, setNotificationPermissionsInfo] = React.useState<NotificationPermissionsInfo | undefined>()
  const [passwordRecoveryKey, setPasswordRecoveryKey] = React.useState<string | undefined>()

  const fontDescription = React.useMemo(
    () => ({
      headingFontFamily: theme.fontFaceMedium,
      regularFontFamily: theme.fontFaceDefault
    }),
    [theme]
  )

  // ---------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------

  const [backgroundImage = theme.backgroundImage] = useAsyncValue<ImageProp | undefined>(async () => {
    const url = pickRandom(theme.backgroundImageServerUrls)
    return await getBackgroundImage(disklet, url, theme.backgroundImage)
  }, [disklet, theme])

  React.useEffect(() => {
    const { YOLO_USERNAME, YOLO_PASSWORD, YOLO_PIN } = ENV
    if (YOLO_USERNAME != null && (Boolean(YOLO_PASSWORD) || Boolean(YOLO_PIN)) && firstRun) {
      firstRun = false
      if (YOLO_PIN != null) {
        context
          .loginWithPIN(YOLO_USERNAME, YOLO_PIN)
          .then(async account => {
            await dispatch(initializeAccount(navigation, account, dummyTouchIdInfo))
          })
          .catch(showError)
      }
      if (YOLO_PASSWORD != null) {
        context
          .loginWithPassword(YOLO_USERNAME, YOLO_PASSWORD)
          .then(async account => {
            await dispatch(initializeAccount(navigation, account, dummyTouchIdInfo))
          })
          .catch(showError)
      }
    }
  }, [context, dispatch, navigation])

  React.useEffect(() => {
    if (pendingDeepLink != null && pendingDeepLink.type === 'passwordRecovery') {
      // Log out if necessary:
      if (account.loggedIn) {
        dispatch(logoutRequest(navigation))
      }

      // Pass the link to our component:
      const { passwordRecoveryKey } = pendingDeepLink
      setPasswordRecoveryKey(passwordRecoveryKey)
      setCounter(counter => counter + 1)
      dispatch({ type: 'DEEP_LINK_HANDLED' })
    }
  }, [account, dispatch, navigation, pendingDeepLink])

  const checkForUpdates = useHandler(async () => {
    const response = await checkVersion()
    const skipUpdate = (await disklet.getText('ignoreUpdate.json').catch(() => '')) === response.version
    if (response.needsUpdate && !skipUpdate) {
      Airship.show(bridge => (
        <UpdateModal
          bridge={bridge}
          onSkip={() => {
            disklet.setText('ignoreUpdate.json', response.version)
            bridge.resolve()
          }}
        />
      ))
    }
  })
  React.useEffect(() => {
    checkForUpdates().catch(error => showError(error))
  }, [checkForUpdates])

  // ---------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------

  const parentButton = React.useMemo(
    () => ({
      callback() {
        Keyboard.dismiss()
        showHelpModal()
      },
      text: lstrings.string_help
    }),
    []
  )

  const maybeHandleComplete = ENV.USE_WELCOME_SCREENS
    ? () => {
        navigation.navigate('gettingStarted', {})
      }
    : undefined

  const handleLogin = useHandler(async (account: EdgeAccount, touchIdInfo: GuiTouchIdInfo | undefined) => {
    setPasswordRecoveryKey(undefined)
    dispatch(initializeAccount(navigation, account, touchIdInfo ?? dummyTouchIdInfo))

    if (notificationPermissionsInfo) {
      try {
        const newSettings = await dispatch(setDeviceSettings(notificationPermissionsInfo.notificationOptIns))
        dispatch({
          type: 'NOTIFICATION_SETTINGS_UPDATE',
          data: serverSettingsToNotificationSettings(newSettings)
        })
      } catch (e) {
        trackError(e, 'LoginScene:onLogin:setDeviceSettings')
        console.error(e)
      }
    }
  })

  const handleSendLogs = useHandler(() => {
    dispatch(showSendLogsModal())
  })

  return loggedIn ? (
    <LoadingScene />
  ) : (
    <View style={styles.container} testID="edge: login-scene">
      <LoginScreen
        key={String(counter)}
        accountOptions={accountOptions}
        appId={config.appId}
        appConfig={config}
        appName={config.appNameShort}
        backgroundImage={backgroundImage}
        context={context}
        fontDescription={fontDescription}
        initialRoute={loginUiInitialRoute}
        parentButton={parentButton}
        primaryLogo={theme.primaryLogo}
        primaryLogoCallback={handleSendLogs}
        recoveryLogin={passwordRecoveryKey}
        skipSecurityAlerts
        username={nextUsername}
        onComplete={maybeHandleComplete}
        onLogin={handleLogin}
        onNotificationPermit={setNotificationPermissionsInfo}
      />
    </View>
  )
}

const accountOptions = {
  pauseWallets: true
}

const dummyTouchIdInfo: GuiTouchIdInfo = {
  isTouchEnabled: true,
  isTouchSupported: true
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: theme.backgroundGradientColors[0]
  }
}))

export const LoginScene = withServices(LoginSceneComponent)
