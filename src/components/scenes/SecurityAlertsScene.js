// @flow

import { type EdgeAccount, type EdgeContext } from 'edge-core-js'
import { SecurityAlertsScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { StatusBar, StyleSheet, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { type RootState } from '../../types/reduxTypes.js'
import { THEME } from '../modals/modalParts.js'

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
        <SecurityAlertsScreen
          account={account}
          context={context}
          onComplete={onComplete}
        />
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

export const SecurityAlertsScene = connect(
  (state: RootState): StateProps => ({
    context: state.core.context,
    account: state.core.account
  }),
  (dispatch: Dispatch): DispatchProps => ({
    onComplete() {
      Actions.pop()
    }
  })
)(SecurityAlertsComponent)
