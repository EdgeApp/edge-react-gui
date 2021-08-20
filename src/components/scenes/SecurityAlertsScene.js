// @flow

import { type EdgeAccount, type EdgeContext } from 'edge-core-js'
import { SecurityAlertsScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { StatusBar, StyleSheet, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz.js'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'

type StateProps = {
  account: EdgeAccount,
  context: EdgeContext
}
type DispatchProps = {
  onComplete: () => void
}
type Props = StateProps & DispatchProps

class SecurityAlertsComponent extends React.Component<Props> {
  render() {
    const { context, account, onComplete } = this.props

    return (
      <View style={styles.container}>
        <SecurityAlertsScreen account={account} context={context} onComplete={onComplete} />
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

export const SecurityAlertsScene = connect<StateProps, DispatchProps, {}>(
  state => ({
    context: state.core.context,
    account: state.core.account
  }),
  dispatch => ({
    onComplete() {
      Actions.pop()
    }
  })
)(SecurityAlertsComponent)
