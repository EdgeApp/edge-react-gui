// @flow

import { PasswordRecoveryScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { SceneWrapper } from '../common/SceneWrapper.js'

type Props = {
  account: Object,
  context: Object,
  onComplete(): void
}
export default class PasswordRecovery extends React.Component<Props> {
  render() {
    return (
      <SceneWrapper hasTabs={false} background="body">
        <PasswordRecoveryScreen
          account={this.props.account}
          context={this.props.context}
          onComplete={this.props.onComplete}
          onCancel={this.props.onComplete}
          showHeader={false}
        />
      </SceneWrapper>
    )
  }
}
