// @flow

import type { EdgeAccount, EdgeContext } from 'edge-core-js'
import { ChangePasswordScreen } from 'edge-login-ui-rn'
import React, { Component } from 'react'
import { ScrollView, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'
import { SceneWrapper } from '../common/SceneWrapper.js'

export type ChangePasswordOwnProps = {
  account: EdgeAccount,
  context: EdgeContext,
  showHeader: boolean
}

export type ChangePasswordDispatchProps = {
  onComplete: () => void
}

export type ChangePasswordStateProps = {
  context: EdgeContext,
  account: EdgeAccount,
  showHeader: boolean
}

type ChangePasswordComponent = ChangePasswordOwnProps & ChangePasswordDispatchProps & ChangePasswordStateProps

export class ChangePassword extends Component<ChangePasswordComponent> {
  onComplete = () => {
    this.props.onComplete()
  }

  render () {
    return (
      <SceneWrapper hasTabs={false} background="body">
        <ScrollView keyboardShouldPersistTaps={'always'}>
          <ChangePasswordScreen
            account={this.props.account}
            context={this.props.context}
            onComplete={this.onComplete}
            onCancel={this.onComplete}
            showHeader={this.props.showHeader}
          />
          <View style={{ backgroundColor: THEME.COLORS.WHITE, height: 360 }} />
        </ScrollView>
      </SceneWrapper>
    )
  }
}

export default ChangePassword
