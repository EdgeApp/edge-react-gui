// @flow

import { BlurView } from '@react-native-community/blur'
import { Disklet } from 'disklet'
import type { EdgeAccount, EdgeContext } from 'edge-core-js'
import { LoginScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { type ImageSourcePropType, Keyboard, StatusBar, View } from 'react-native'
import { checkVersion } from 'react-native-check-version'

import ENV from '../../../env.json'
import { showSendLogsModal } from '../../actions/LogActions.js'
import { initializeAccount, logoutRequest } from '../../actions/LoginActions.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../components/services/ThemeContext.js'
import s from '../../locales/strings.js'
import { config } from '../../theme/appConfig.js'
import { type DeepLink } from '../../types/DeepLinkTypes.js'
import { connect } from '../../types/reactRedux.js'
import { type GuiTouchIdInfo } from '../../types/types.js'
import { pickRandom } from '../../util/utils'
import { showHelpModal } from '../modals/HelpModal.js'
import { UpdateModal } from '../modals/UpdateModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { getBackgroundImage } from './../../util/ThemeCache.js'
import { LoadingScene } from './LoadingScene.js'

// Sneak the BlurView over to the login UI:
global.ReactNativeBlurView = BlurView

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext,
  disklet: Disklet,
  pendingDeepLink: DeepLink | null,
  username: string
}
type DispatchProps = {
  deepLinkHandled: () => void,
  handleSendLogs: () => void,
  initializeAccount: (account: EdgeAccount, touchIdInfo: GuiTouchIdInfo) => void,
  logout: () => void
}
type Props = StateProps & DispatchProps & ThemeProps

type State = {
  counter: number,
  backgroundImage: ImageSourcePropType | null,
  isYolo: boolean,
  passwordRecoveryKey?: string
}

// Flag to disallow YOLO logins more than once (after logout) after app startup.
let isFirstRun = true

class LoginSceneComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    const { YOLO_USERNAME, YOLO_PASSWORD, YOLO_PIN } = ENV
    this.state = {
      counter: 0,
      needsUpdate: false,
      backgroundImage: null,
      isYolo: YOLO_USERNAME != null && (YOLO_PASSWORD != null || YOLO_PIN != null)
    }
  }

  getSkipUpdate() {
    return this.props.disklet.getText('ignoreUpdate.json').catch(() => '')
  }

  async componentDidMount() {
    const { theme } = this.props
    let skipUpdate = true
    if (this.state.isYolo && isFirstRun) {
      isFirstRun = false
      const { context, initializeAccount } = this.props
      const { YOLO_USERNAME, YOLO_PASSWORD, YOLO_PIN } = ENV
      if (YOLO_PIN != null) {
        context
          .loginWithPIN(YOLO_USERNAME, YOLO_PIN)
          .then(account => initializeAccount(account, dummyTouchIdInfo))
          .catch(showError)
      }
      if (YOLO_PASSWORD != null) {
        context
          .loginWithPassword(YOLO_USERNAME, YOLO_PASSWORD)
          .then(account => initializeAccount(account, dummyTouchIdInfo))
          .catch(showError)
      }
      return // Skip the update checks and background image fetch if YOLOing
    }

    pickRandom(theme.backgroundImageServerUrls)
    const backgroundImageServerUrl = pickRandom(theme.backgroundImageServerUrls)
    getBackgroundImage(this.props.disklet, backgroundImageServerUrl, theme.backgroundImage)
      .then(backgroundImage => this.setState({ backgroundImage }))
      .catch(e => this.setState({ backgroundImage: theme.backgroundImage }))
    const response = await checkVersion()
    skipUpdate = (await this.getSkipUpdate()) === response.version
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
    if (this.state.isYolo) return // Skip if YOLOing

    const { account, pendingDeepLink, theme } = this.props
    const backgroundImageServerUrl = pickRandom(theme.backgroundImageServerUrls)

    getBackgroundImage(this.props.disklet, backgroundImageServerUrl, theme.backgroundImage)
      .then(backgroundImage => {
        if (backgroundImage != null && this.state.backgroundImage != null) {
          if (backgroundImage.uri === this.state.backgroundImage.uri) {
            return
          }
        }
        this.setState({ backgroundImage })
      })
      .catch(e => this.setState({ backgroundImage: theme.backgroundImage }))

    // Did we get a new recovery link?
    if (pendingDeepLink !== oldProps.pendingDeepLink && pendingDeepLink != null && pendingDeepLink.type === 'passwordRecovery') {
      // Log out if necessary:
      if (account.username !== null) this.props.logout()

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

  onLogin = (account: EdgeAccount, touchIdInfo: GuiTouchIdInfo | void) => {
    this.setState({ passwordRecoveryKey: undefined })
    this.props.initializeAccount(account, touchIdInfo ?? dummyTouchIdInfo)
  }

  render() {
    const { context, handleSendLogs, theme, username } = this.props
    const { counter, passwordRecoveryKey, backgroundImage } = this.state
    const styles = getStyles(theme)

    return this.props.account.username == null ? (
      <View style={styles.container} testID="edge: login-scene">
        <LoginScreen
          username={username}
          appId={config.appId}
          accountOptions={{ pauseWallets: true }}
          context={context}
          recoveryLogin={passwordRecoveryKey}
          onLogin={this.onLogin}
          fontDescription={{ regularFontFamily: theme.fontFaceDefault, headingFontFamily: theme.fontFaceMedium }}
          key={String(counter)}
          appName={config.appNameShort}
          backgroundImage={backgroundImage}
          primaryLogo={theme.primaryLogo}
          primaryLogoCallback={handleSendLogs}
          parentButton={{ text: s.strings.string_help, callback: this.onClickHelp }}
          skipSecurityAlerts
        />
      </View>
    ) : (
      <LoadingScene />
    )
  }
}

const dummyTouchIdInfo: GuiTouchIdInfo = {
  isTouchEnabled: false,
  isTouchSupported: false
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    position: 'relative',
    paddingTop: StatusBar.currentHeight,
    backgroundColor: theme.backgroundGradientColors[0]
  }
}))

export const LoginScene = connect<StateProps, DispatchProps, {}>(
  state => ({
    account: state.core.account,
    context: state.core.context,
    disklet: state.core.disklet,
    pendingDeepLink: state.pendingDeepLink,
    username: state.nextUsername == null ? '' : state.nextUsername
  }),
  dispatch => ({
    deepLinkHandled() {
      dispatch({ type: 'DEEP_LINK_HANDLED' })
    },
    handleSendLogs() {
      dispatch(showSendLogsModal())
    },
    initializeAccount(account, touchIdInfo) {
      dispatch(initializeAccount(account, touchIdInfo))
    },
    logout() {
      dispatch(logoutRequest())
    }
  })
)(withTheme(LoginSceneComponent))
