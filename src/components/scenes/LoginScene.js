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
import { initializeAccount } from '../../modules/Login/action'
import THEME from '../../theme/variables/airbitz.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { showHelpModal } from '../modals/HelpModal.js'

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext,
  recoveryKey: string | null,
  username: string
}
type DispatchProps = {
  initializeAccount(account: EdgeAccount, touchIdInfo: Object): void,
  showSendLogsModal(): void
}
type Props = StateProps & DispatchProps

type State = { key: number }

class LoginSceneComponent extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = { key: 0 }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
    // If we have logged out, destroy and recreate the login screen:
    if (this.props.account && nextProps.account && nextProps.account !== this.props.account) {
      if (typeof nextProps.account.username === 'undefined') {
        this.setState({ key: this.state.key + 1 })
      }
    }
  }

  onClickHelp () {
    Keyboard.dismiss()
    showHelpModal()
  }

  onLogin = (error: Error | null, account: EdgeAccount | null, touchIdInfo: Object) => {
    if (error != null) return
    if (account != null) this.props.initializeAccount(account, touchIdInfo)
  }

  render () {
    return !this.props.context.listUsernames ? null : (
      <View style={styles.container} testID={'edge: login-scene'}>
        <LoginScreen
          username={this.props.username}
          accountOptions={null}
          context={this.props.context}
          recoveryLogin={this.props.recoveryKey}
          onLogin={this.onLogin}
          fontDescription={{ regularFontFamily: THEME.FONTS.DEFAULT }}
          key={this.state.key.toString()}
          appName={s.strings.app_name_short}
          backgroundImage={edgeBackgroundImage}
          primaryLogo={edgeLogo}
          primaryLogoCallback={this.props.showSendLogsModal}
          parentButton={{ text: s.strings.string_help, callback: this.onClickHelp }}
        />
      </View>
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
    recoveryKey: state.core.deepLinking.passwordRecoveryLink,
    username: state.nextUsername == null ? '' : state.nextUsername
  }),

  (dispatch: Dispatch): DispatchProps => ({
    showSendLogsModal () {
      dispatch(showSendLogsModal())
    },
    initializeAccount (account, touchIdInfo) {
      dispatch(initializeAccount(account, touchIdInfo))
    }
  })
)(LoginSceneComponent)
