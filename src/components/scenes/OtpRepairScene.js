// @flow

import { type EdgeAccount, type EdgeContext, type OtpError } from 'edge-core-js'
import { OtpRepairScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { StatusBar, StyleSheet, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { type RootState } from '../../types/reduxTypes.js'
import { THEME } from '../modals/modalParts.js'

type OwnProps = {
  otpError: OtpError
}
type StateProps = {
  account: EdgeAccount,
  context: EdgeContext
}
type DispatchProps = {
  onComplete: () => void
}
type Props = OwnProps & StateProps & DispatchProps

class OtpRepairComponent extends React.Component<Props> {
  render() {
    const { context, account, onComplete, otpError } = this.props

    return (
      <View style={styles.container}>
        <OtpRepairScreen account={account} context={context} onComplete={onComplete} otpError={otpError} />
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

export const OtpRepairScene = connect(
  (state: RootState): StateProps => ({
    context: state.core.context,
    account: state.core.account
  }),
  (dispatch: Dispatch): DispatchProps => ({
    onComplete() {
      Actions.pop()
    }
  })
)(OtpRepairComponent)
