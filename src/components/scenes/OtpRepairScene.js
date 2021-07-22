// @flow

import { type EdgeAccount, type EdgeContext } from 'edge-core-js'
import { OtpRepairScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { StatusBar, StyleSheet, View } from 'react-native'

import { connect } from '../../types/reactRedux.js'
import { type RouteProp, Actions } from '../../types/routerTypes.js'
import { THEME } from '../modals/modalParts.js'

type OwnProps = {
  route: RouteProp<'otpRepair'>
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
    const { context, account, onComplete, route } = this.props
    const { otpError } = route.params

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

export const OtpRepairScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    context: state.core.context,
    account: state.core.account
  }),
  dispatch => ({
    onComplete() {
      Actions.pop()
    }
  })
)(OtpRepairComponent)
