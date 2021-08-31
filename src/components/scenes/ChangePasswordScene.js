// @flow

import { type EdgeAccount, type EdgeContext } from 'edge-core-js'
import { ChangePasswordScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext
}
type DispatchProps = {
  onComplete: () => void
}
type Props = StateProps & DispatchProps

class ChangePasswordComponent extends React.Component<Props> {
  render() {
    const { context, account, onComplete } = this.props

    return (
      <SceneWrapper hasTabs={false} background="body">
        <ChangePasswordScreen account={account} context={context} onComplete={onComplete} onCancel={onComplete} showHeader={false} />
      </SceneWrapper>
    )
  }
}

export const ChangePasswordScene = connect<StateProps, DispatchProps, {}>(
  state => ({
    context: state.core.context,
    account: state.core.account
  }),
  dispatch => ({
    onComplete: Actions.pop
  })
)(ChangePasswordComponent)
