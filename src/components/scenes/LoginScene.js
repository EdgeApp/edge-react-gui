// @flow

import { BlurView } from '@react-native-community/blur'
import { Disklet } from 'disklet'
import type { EdgeAccount, EdgeContext } from 'edge-core-js'
import { LoginScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { type ImageSourcePropType, Keyboard, StatusBar, StyleSheet, View } from 'react-native'
import { checkVersion } from 'react-native-check-version'

import ENV from '../../../env.json'
import { showSendLogsModal } from '../../actions/LogActions.js'
import { initializeAccount, logoutRequest } from '../../actions/LoginActions.js'
import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_L.png'
import { type ThemeProps, withTheme } from '../../components/services/ThemeContext.js'
import s from '../../locales/strings.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type DeepLink } from '../../types/DeepLinkTypes.js'
import { connect } from '../../types/reactRedux.js'
import { type GuiTouchIdInfo } from '../../types/types.js'
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
  passwordRecoveryKey?: string,
  backgroundImage: ImageSourcePropType | null
}

let firstRun = true

class LoginSceneComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      counter: 0,
      needsUpdate: false,
      backgroundImage: null
    }
  }

  getSkipUpdate() {
    return this.props.disklet.getText('ignoreUpdate.json').catch(() => '')
  }

  async componentDidMount() {
    getBackgroundImage(this.props.disklet)
      .then(backgroundImage => this.setState({ backgroundImage }))
      .catch(e => console.log(e?.message ?? ''))
    const { YOLO_USERNAME, YOLO_PASSWORD } = ENV
    if (YOLO_USERNAME != null && YOLO_PASSWORD != null && firstRun) {
      const { context, initializeAccount } = this.props
      firstRun = false
      setTimeout(() => {
        context
          .loginWithPassword(YOLO_USERNAME, YOLO_PASSWORD)
          .then(account => initializeAccount(account, dummyTouchIdInfo))
          .catch(showError)
      }, 500)
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
    const { account, pendingDeepLink } = this.props

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

    return this.props.account.username == null ? (
      <View style={styles.container} testID="edge: login-scene">
        <LoginScreen
          username={username}
          accountOptions={{ pauseWallets: true }}
          context={context}
          recoveryLogin={passwordRecoveryKey}
          onLogin={this.onLogin}
          fontDescription={{ regularFontFamily: theme.fontFaceDefault, headingFontFamily: theme.fontFaceMedium }}
          key={String(counter)}
          appName={s.strings.app_name_short}
          backgroundImage={backgroundImage}
          primaryLogo={edgeLogo}
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

const rawStyles = {
  container: {
    flex: 1,
    position: 'relative',
    paddingTop: StatusBar.currentHeight,
    backgroundColor: THEME.COLORS.PRIMARY
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

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
