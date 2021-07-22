// @flow

import { type EdgeAccount, type EdgeContext } from 'edge-core-js'
import { ChangePinScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { Actions } from 'react-native-router-flux'

import { connect } from '../../types/reactRedux.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext
}
type DispatchProps = {
  onComplete: () => void
}
type Props = StateProps & DispatchProps

class ChangePinComponent extends React.Component<Props> {
  render() {
    const { context, account, onComplete } = this.props

    return (
      <SceneWrapper hasTabs={false} background="body">
        <ChangePinScreen account={account} context={context} onComplete={onComplete} onCancel={onComplete} showHeader={false} />
      </SceneWrapper>
    )
  }
}

export const ChangePinScene = connect<StateProps, DispatchProps, {}>(
  state => ({
    context: state.core.context,
    account: state.core.account
  }),
  dispatch => ({
    onComplete: Actions.pop
  })
)(ChangePinComponent)
