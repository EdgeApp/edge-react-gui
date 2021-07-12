// @flow

import { Disklet } from 'disklet'
import type { EdgeAccount, EdgeContext } from 'edge-core-js'
import { LoginScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { Keyboard, Linking, Platform, StatusBar, StyleSheet, View } from 'react-native'
import { checkVersion } from 'react-native-check-version'
import { getBundleId } from 'react-native-device-info'

import ENV from '../../../env.json'
import edgeBackgroundImage from '../../assets/images/edgeBackground/login_bg.gif'
import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_L.png'
import s from '../../locales/strings.js'
import { initializeAccount, logoutRequest } from '../../modules/Login/action.js'
import THEME from '../../theme/variables/airbitz.js'
import { type DeepLink } from '../../types/DeepLink.js'
import { connect } from '../../types/reactRedux.js'
import { type GuiTouchIdInfo } from '../../types/types.js'
import { showHelpModal } from '../modals/HelpModal.js'
import { SendLogsModal } from '../modals/SendLogsModal'
import { UpdateModal } from '../modals/UpdateModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { LoadingScene } from './LoadingScene.js'

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext,
  disklet: Disklet,
  pendingDeepLink: DeepLink | null,
  username: string
}
type DispatchProps = {
  deepLinkHandled: () => void,
  initializeAccount: (account: EdgeAccount, touchIdInfo: GuiTouchIdInfo) => void,
  logout: () => void
}
type Props = StateProps & DispatchProps

type State = {
  counter: number,
  passwordRecoveryKey?: string
}

let firstRun = true

class LoginSceneComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      counter: 0,
      needsUpdate: false
    }
  }

  getSkipUpdate() {
    return this.props.disklet.getText('ignoreUpdate.json').catch(() => '')
  }

  async componentDidMount() {
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
          onUpdate={() => {
            const bundleId = getBundleId()
            const url =
              Platform.OS === 'android'
                ? `http://play.app.goo.gl/?link=http://play.google.com/store/apps/details?id=${bundleId}`
                : `https://itunes.apple.com/app/id1344400091`
            Linking.openURL(url)
            bridge.resolve()
          }}
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

  showSendLogsModal = () => {
    Airship.show(bridge => <SendLogsModal bridge={bridge} />)
  }

  render() {
    const { counter, passwordRecoveryKey } = this.state

    return this.props.account.username == null ? (
      <View style={styles.container} testID="edge: login-scene">
        <LoginScreen
          username={this.props.username}
          accountOptions={{ pauseWallets: true }}
          context={this.props.context}
          recoveryLogin={passwordRecoveryKey}
          onLogin={this.onLogin}
          fontDescription={{ regularFontFamily: THEME.FONTS.DEFAULT }}
          key={String(counter)}
          appName={s.strings.app_name_short}
          backgroundImage={edgeBackgroundImage}
          primaryLogo={edgeLogo}
          primaryLogoCallback={this.showSendLogsModal}
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
    initializeAccount(account, touchIdInfo) {
      dispatch(initializeAccount(account, touchIdInfo))
    },
    logout() {
      dispatch(logoutRequest())
    }
  })
)(LoginSceneComponent)
