import { EdgeAccount, EdgeContext } from 'edge-core-js'
import { SecurityAlertsScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { StatusBar, StyleSheet, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'

interface OwnProps extends EdgeSceneProps<'securityAlerts'> {}

interface StateProps {
  account: EdgeAccount
  context: EdgeContext
}
type Props = StateProps & OwnProps

class SecurityAlertsComponent extends React.Component<Props> {
  render() {
    const { context, account, navigation } = this.props
    const handleComplete = () => navigation.pop()

    return (
      <View style={styles.container}>
        <SecurityAlertsScreen account={account} context={context} onComplete={handleComplete} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: THEME.COLORS.PRIMARY
  }
})

export const SecurityAlertsScene = connect<StateProps, {}, OwnProps>(
  state => ({
    context: state.core.context,
    account: state.core.account
  }),
  dispatch => ({})
)(SecurityAlertsComponent)
