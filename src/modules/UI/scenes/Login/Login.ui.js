// @flow

import React, {Component} from 'react'
import {Actions} from 'react-native-router-flux'
import {LoginScreen} from 'airbitz-core-js-ui'
import type {AbcAccount, AbcContext} from 'airbitz-core-types'
import type {GuiTouchIdInfo} from '../../../../types.js'
import type {Dispatch} from '../../../ReduxTypes'

import makeAccountCallbacks from '../../../Core/Account/callbacks'
import * as CONTEXT_API from '../../../Core/Context/api'
import THEME from '../../../../theme/variables/airbitz'

type LoginOwnProps = {
  initializeAccount: (AbcAccount, touchIdInfo: ?Object) => void,
  addUsernames: (Array<string>) => void,
  dispatch: Dispatch,
  username?: string
}

export type LoginStateProps = {
  context: AbcContext,
  account: AbcAccount,
  username: string
}

export type LoginDispatchProps = {
  addUsername: (Array<string>) => void,
  initializeAccount: (AbcAccount, string) => void
}

type LoginProps = LoginOwnProps & LoginStateProps & LoginDispatchProps

type State = {key: number}

export default class Login extends Component<LoginProps, State> {
  constructor (props: LoginProps) {
    super(props)
    this.state = {key: 0}
  }

  onLogin = (error: ?Error = null, account: ?AbcAccount, touchIdInfo: ?GuiTouchIdInfo = null) => {
    if (error || !account) return
    Actions.edge()
    this.props.initializeAccount(account, touchIdInfo)

    CONTEXT_API.listUsernames(this.props.context) // update users list after each login
    .then((usernames) => {
      this.props.addUsernames(usernames)
    })
  }

  componentWillReceiveProps (nextProps: LoginProps) {
    // If we have logged out, destroy and recreate the login screen:
    if (this.props.account && nextProps.account && (nextProps.account !== this.props.account)) {
      if (typeof nextProps.account.username === 'undefined') {
        this.setState({key: this.state.key + 1})
      }
    }
  }

  render () {
    const callbacks = makeAccountCallbacks(this.props.dispatch)
    return !this.props.context.listUsernames ? null : (
      <LoginScreen
        username={this.props.username}
        accountOptions={{callbacks}}
        context={this.props.context}
        onLogin={this.onLogin}
        fontDescription={{
          regularFontFamily: THEME.FONTS.DEFAULT
        }}
        key={this.state.key.toString()}
      />
    )
  }
}
