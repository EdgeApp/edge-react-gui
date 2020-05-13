// @flow

import { PasswordRecoveryScreen } from 'edge-login-ui-rn'
import React, { Component } from 'react'

import { SceneWrapper } from '../common/SceneWrapper.js'

type Props = {
  account: Object,
  context: Object,
  showHeader: boolean,
  onComplete(): void
}
export default class PasswordRecovery extends Component<Props> {
  render() {
    return (
      <SceneWrapper hasTabs={false} background="body">
        <PasswordRecoveryScreen
          account={this.props.account}
          context={this.props.context}
          onComplete={this.props.onComplete}
          onCancel={this.props.onComplete}
          showHeader={this.props.showHeader}
        />
      </SceneWrapper>
    )
  }
}
