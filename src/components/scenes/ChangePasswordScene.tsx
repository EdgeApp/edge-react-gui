import { EdgeAccount, EdgeContext } from 'edge-core-js'
import { ChangePasswordScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { connect } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { SceneWrapper } from '../common/SceneWrapper'

type OwnProps = {
  navigation: NavigationProp<'changePassword'>
}

type StateProps = {
  account: EdgeAccount
  context: EdgeContext
}
type Props = StateProps & OwnProps

export class ChangePasswordComponent extends React.Component<Props> {
  render() {
    const { context, account, navigation } = this.props
    const handleComplete = () => {
      logActivity(`Password Changed: ${account.username}`)
      navigation.goBack()
    }
    return (
      <SceneWrapper hasTabs={false} background="theme">
        <ChangePasswordScreen account={account} context={context} onComplete={handleComplete} showHeader={false} />
      </SceneWrapper>
    )
  }
}

export const ChangePasswordScene = connect<StateProps, {}, OwnProps>(
  state => ({
    context: state.core.context,
    account: state.core.account
  }),
  dispatch => ({})
)(ChangePasswordComponent)
