// @flow

import { type EdgeAccount, type EdgeContext } from 'edge-core-js'
import { PasswordRecoveryScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { type RootState } from '../../types/reduxTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext
}
type DispatchProps = {
  onComplete: () => void
}
type Props = StateProps & DispatchProps

class ChangeRecoveryComponent extends React.Component<Props> {
  render() {
    const { context, account, onComplete } = this.props

    return (
      <SceneWrapper hasTabs={false} background="body">
        <PasswordRecoveryScreen account={account} context={context} onComplete={onComplete} onCancel={onComplete} showHeader={false} />
      </SceneWrapper>
    )
  }
}

export const ChangeRecoveryScene = connect(
  (state: RootState): StateProps => ({
    context: state.core.context,
    account: state.core.account
  }),
  (dispatch: Dispatch): DispatchProps => ({
    onComplete() {
      Actions.pop()
    }
  })
)(ChangeRecoveryComponent)
