// @flow

import { type EdgeAccount, type EdgeContext } from 'edge-core-js'
import { SecurityAlertsScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { StatusBar, StyleSheet, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'

type OwnProps = {
  navigation: NavigationProp<'securityAlerts'>
}
type StateProps = {
  account: EdgeAccount,
  context: EdgeContext
}
type Props = StateProps & OwnProps

class SecurityAlertsComponent extends React.Component<Props> {
  render() {
    const { context, account, navigation } = this.props
    const handleComplete = () => navigation.goBack()

    return (
      <View style={styles.container}>
        <SecurityAlertsScreen account={account} context={context} onComplete={handleComplete} />
      </View>
    )
  }
}

const rawStyles = {
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: THEME.COLORS.PRIMARY
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const SecurityAlertsScene = connect<StateProps, {}, OwnProps>(
  state => ({
    context: state.core.context,
    account: state.core.account
  }),
  dispatch => ({})
)(SecurityAlertsComponent)
