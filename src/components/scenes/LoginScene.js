// @flow

import type { EdgeAccount, EdgeContext } from 'edge-core-js'
import { LoginScreen } from 'edge-login-ui-rn'
import React, { Component } from 'react'
import { Keyboard, StatusBar, StyleSheet, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { connect } from 'react-redux'

import { showSendLogsModal } from '../../actions/SettingsActions'
import edgeBackgroundImage from '../../assets/images/edgeBackground/login_bg.jpg'
import edgeLogo from '../../assets/images/edgeLogo/Edge_logo_L.png'
import s from '../../locales/strings.js'
import { initializeAccount, logoutRequest } from '../../modules/Login/action.js'
import THEME from '../../theme/variables/airbitz.js'
import { type DeepLink } from '../../types/DeepLink.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { showHelpModal } from '../modals/HelpModal.js'
import { LoadingScene } from './LoadingScene.js'

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext,
  pendingDeepLink: DeepLink | null,
  username: string
}
type DispatchProps = {
  deepLinkHandled(): void,
  initializeAccount(account: EdgeAccount, touchIdInfo: Object): void,
  logout(): void,
  showMainApp(): void,
  showSendLogsModal(): void
}
type Props = StateProps & DispatchProps

type State = {
  counter: number,
  passwordRecoveryKey?: string
}

class LoginSceneComponent extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = { counter: 0 }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentDidMount () {
    this.props.showMainApp()
  }

  componentDidUpdate (oldProps: Props) {
    const { account, pendingDeepLink } = this.props

    // Did we get a new recovery link?
    if (pendingDeepLink !== oldProps.pendingDeepLink && pendingDeepLink != null && pendingDeepLink.type === 'passwordRecovery') {
      // Log out if necessary:
      if (account.username !== null) this.props.logout()

      // Pass the link to our component:
      const { passwordRecoveryKey } = pendingDeepLink
      this.setState(state => ({ passwordRecoveryKey, counter: state.counter + 1 }))
      this.props.deepLinkHandled()
    }
  }

  onClickHelp () {
    Keyboard.dismiss()
    showHelpModal()
  }

  onLogin = (error: Error | null, account: EdgeAccount | null, touchIdInfo: Object) => {
    if (error != null) return
    this.setState({ passwordRecoveryKey: undefined })
    if (account != null) this.props.initializeAccount(account, touchIdInfo)
  }

  render () {
    const { counter, passwordRecoveryKey } = this.state

    return this.props.account.username == null ? (
      <View style={styles.container} testID={'edge: login-scene'}>
        <LoginScreen
          username={this.props.username}
          accountOptions={null}
          context={this.props.context}
          recoveryLogin={passwordRecoveryKey}
          onLogin={this.onLogin}
          fontDescription={{ regularFontFamily: THEME.FONTS.DEFAULT }}
          key={String(counter)}
          appName={s.strings.app_name_short}
          backgroundImage={edgeBackgroundImage}
          primaryLogo={edgeLogo}
          primaryLogoCallback={this.props.showSendLogsModal}
          parentButton={{ text: s.strings.string_help, callback: this.onClickHelp }}
        />
      </View>
    ) : (
      <LoadingScene />
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    paddingTop: StatusBar.currentHeight,
    backgroundColor: THEME.COLORS.PRIMARY
  }
})

export const LoginScene = connect(
  (state: ReduxState): StateProps => ({
    context: state.core.context,
    account: state.core.account,
    pendingDeepLink: state.pendingDeepLink,
    username: state.nextUsername == null ? '' : state.nextUsername
  }),

  (dispatch: Dispatch): DispatchProps => ({
    deepLinkHandled () {
      dispatch({ type: 'DEEP_LINK_HANDLED' })
    },
    initializeAccount (account, touchIdInfo) {
      dispatch(initializeAccount(account, touchIdInfo))
    },
    logout () {
      dispatch(logoutRequest())
    },
    showMainApp () {
      dispatch({ type: 'SHOW_MAIN_APP' })
    },
    showSendLogsModal () {
      dispatch(showSendLogsModal())
    }
  })
)(LoginSceneComponent)
