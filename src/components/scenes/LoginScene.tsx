import { Disklet } from 'disklet'
import { EdgeAccount, EdgeContext } from 'edge-core-js'
import { LoginScreen } from 'edge-login-ui-rn'
import { NotificationPermissionsInfo } from 'edge-login-ui-rn/lib/types/ReduxTypes'
import * as React from 'react'
import { Keyboard, StatusBar, View } from 'react-native'
import { checkVersion } from 'react-native-check-version'
import { BlurView } from 'rn-id-blurview'

import { showSendLogsModal } from '../../actions/LogActions'
import { initializeAccount, logoutRequest } from '../../actions/LoginActions'
import { serverSettingsToNotificationSettings, setDeviceSettings } from '../../actions/NotificationActions'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../../components/services/ThemeContext'
import { ENV } from '../../env'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { DeepLink } from '../../types/DeepLinkTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { Dispatch } from '../../types/reduxTypes'
import { NavigationBase, NavigationProp, RouteProp } from '../../types/routerTypes'
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

interface OwnProps {
  navigation: NavigationProp<'login'>
  route: RouteProp<'login'>
}
interface StateProps {
  account: EdgeAccount
  context: EdgeContext
  disklet: Disklet
  pendingDeepLink: DeepLink | null
  username: string
}
interface DispatchProps {
  deepLinkHandled: () => void
  dispatch: Dispatch
  handleSendLogs: () => void
  initializeAccount: (navigation: NavigationBase, account: EdgeAccount, touchIdInfo: GuiTouchIdInfo) => void
  logout: () => void
}
type Props = OwnProps & StateProps & DispatchProps & ThemeProps

interface State {
  counter: number
  passwordRecoveryKey?: string
  backgroundImage: ImageProp | null
  needsUpdate: boolean
  notificationPermissionsInfo?: NotificationPermissionsInfo
}

let firstRun = true

class LoginSceneComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      counter: 0,
      backgroundImage: null,
      needsUpdate: false
    }
  }

  async getSkipUpdate() {
    return await this.props.disklet.getText('ignoreUpdate.json').catch(() => '')
  }

  async componentDidMount() {
    const { navigation, theme } = this.props
    const backgroundImageServerUrl = pickRandom(theme.backgroundImageServerUrls)
    getBackgroundImage(this.props.disklet, backgroundImageServerUrl, theme.backgroundImage)
      .then(backgroundImage => this.setState({ backgroundImage }))
      // @ts-expect-error
      .catch(e => this.setState({ backgroundImage: theme.backgroundImage }))
    const { YOLO_USERNAME, YOLO_PASSWORD, YOLO_PIN } = ENV
    if (YOLO_USERNAME != null && (Boolean(YOLO_PASSWORD) || Boolean(YOLO_PIN)) && firstRun) {
      const { context, initializeAccount } = this.props
      firstRun = false
      if (YOLO_PIN != null) {
        context
          .loginWithPIN(YOLO_USERNAME, YOLO_PIN)
          .then(account => initializeAccount(navigation, account, dummyTouchIdInfo))
          .catch(showError)
      }
      if (YOLO_PASSWORD != null) {
        context
          .loginWithPassword(YOLO_USERNAME, YOLO_PASSWORD)
          .then(account => initializeAccount(navigation, account, dummyTouchIdInfo))
          .catch(showError)
      }
    }
    const response = await checkVersion()
    const skipUpdate = (await this.getSkipUpdate()) === response.version
    if (response.needsUpdate && !skipUpdate) {
      Airship.show(bridge => (
        <UpdateModal
          bridge={bridge}
          onSkip={() => {
            this.props.disklet.setText('ignoreUpdate.json', response.version)
            bridge.resolve()
          }}
        />
      ))
    }
  }

  componentDidUpdate(oldProps: Props) {
    const { account, pendingDeepLink, theme } = this.props
    const backgroundImageServerUrl = pickRandom(theme.backgroundImageServerUrls)

    getBackgroundImage(this.props.disklet, backgroundImageServerUrl, theme.backgroundImage)
      .then(backgroundImage => {
        if (backgroundImage != null && this.state.backgroundImage != null) {
          // @ts-expect-error
          if (backgroundImage.uri === this.state.backgroundImage.uri) {
            return
          }
        }
        this.setState({ backgroundImage })
      })
      // @ts-expect-error
      .catch(e => this.setState({ backgroundImage: theme.backgroundImage }))

    // Did we get a new recovery link?
    if (pendingDeepLink !== oldProps.pendingDeepLink && pendingDeepLink != null && pendingDeepLink.type === 'passwordRecovery') {
      // Log out if necessary:
      if (account.username != null) this.props.logout()

      // Pass the link to our component:
      const { passwordRecoveryKey } = pendingDeepLink
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(state => ({ passwordRecoveryKey, counter: state.counter + 1 }))
      this.props.deepLinkHandled()
    }
  }

  onClickHelp() {
    Keyboard.dismiss()
    showHelpModal()
  }

  onComplete = () => {
    this.props.navigation.navigate('gettingStarted', {})
  }

  onLogin = async (account: EdgeAccount, touchIdInfo: GuiTouchIdInfo | undefined) => {
    const { navigation } = this.props
    this.setState({ passwordRecoveryKey: undefined })
    this.props.initializeAccount(navigation, account, touchIdInfo ?? dummyTouchIdInfo)

    const { notificationPermissionsInfo } = this.state
    if (notificationPermissionsInfo) {
      try {
        const newSettings = await this.props.dispatch(setDeviceSettings(notificationPermissionsInfo.notificationOptIns))
        this.props.dispatch({
          type: 'NOTIFICATION_SETTINGS_UPDATE',
          data: serverSettingsToNotificationSettings(newSettings)
        })
      } catch (e) {
        trackError(e, 'LoginScene:onLogin:setDeviceSettings')
        console.error(e)
      }
    }
  }

  onNotificationPermit = (notificationPermissionsInfo: NotificationPermissionsInfo) => {
    this.setState({ notificationPermissionsInfo })
  }

  render() {
    const { context, handleSendLogs, route, theme, username } = this.props
    const { counter, passwordRecoveryKey, backgroundImage } = this.state
    const { loginUiInitialRoute = 'login' } = route.params ?? {}
    const styles = getStyles(theme)

    return this.props.account.username == null ? (
      <View style={styles.container} testID="edge: login-scene">
        <LoginScreen
          username={username}
          appId={config.appId}
          accountOptions={{ pauseWallets: true }}
          context={context}
          initialRoute={loginUiInitialRoute}
          recoveryLogin={passwordRecoveryKey}
          onComplete={this.onComplete}
          onLogin={this.onLogin}
          onNotificationPermit={this.onNotificationPermit}
          fontDescription={{ regularFontFamily: theme.fontFaceDefault, headingFontFamily: theme.fontFaceMedium }}
          key={String(counter)}
          appName={config.appNameShort}
          backgroundImage={backgroundImage}
          primaryLogo={theme.primaryLogo}
          primaryLogoCallback={handleSendLogs}
          parentButton={{ text: lstrings.string_help, callback: this.onClickHelp }}
          skipSecurityAlerts
        />
      </View>
    ) : (
      <LoadingScene />
    )
  }
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

export const LoginScene = withServices((props: OwnProps) => {
  const { navigation } = props
  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)
  const disklet = useSelector(state => state.core.disklet)
  const pendingDeepLink = useSelector(state => state.pendingDeepLink)
  const username = useSelector(state => state.nextUsername ?? '')
  const stateProps: StateProps = {
    account,
    context,
    disklet,
    pendingDeepLink,
    username
  }
  const theme = useTheme()
  const themeProps: ThemeProps = {
    theme
  }
  const dispatchProps: DispatchProps = {
    deepLinkHandled() {
      dispatch({ type: 'DEEP_LINK_HANDLED' })
    },
    dispatch,
    handleSendLogs() {
      dispatch(showSendLogsModal())
    },
    initializeAccount(navigation, account, touchIdInfo) {
      dispatch(initializeAccount(navigation, account, touchIdInfo))
    },
    logout() {
      dispatch(logoutRequest(navigation))
    }
  }

  return <LoginSceneComponent {...props} {...dispatchProps} {...stateProps} {...themeProps} />
})
