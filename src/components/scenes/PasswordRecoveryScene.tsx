import { EdgeAccount, EdgeContext } from 'edge-core-js'
import { PasswordRecoveryScreen } from 'edge-login-ui-rn'
import * as React from 'react'

import { config } from '../../theme/appConfig'
import { connect } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
type OwnProps = {
  navigation: NavigationProp<'passwordRecovery'>
}
type StateProps = {
  account: EdgeAccount
  context: EdgeContext
}
type Props = StateProps & OwnProps

class ChangeRecoveryComponent extends React.Component<Props> {
  render() {
    const { context, account, navigation } = this.props
    const handleComplete = () => navigation.goBack()

    return (
      <SceneWrapper hasTabs={false} background="body">
        <PasswordRecoveryScreen
          branding={{ appName: config.appName }}
          account={account}
          context={context}
          onComplete={handleComplete}
          onCancel={handleComplete}
          showHeader={false}
        />
      </SceneWrapper>
    )
  }
}

export const ChangeRecoveryScene = connect<StateProps, {}, OwnProps>(
  state => ({
    context: state.core.context,
    account: state.core.account
  }),
  dispatch => ({})
)(ChangeRecoveryComponent)
