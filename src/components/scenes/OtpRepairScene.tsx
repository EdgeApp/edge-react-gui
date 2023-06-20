import { EdgeAccount, EdgeContext } from 'edge-core-js'
import { OtpRepairScreen } from 'edge-login-ui-rn'
import * as React from 'react'
import { StatusBar, StyleSheet, View } from 'react-native'

import { config } from '../../theme/appConfig'
import { THEME } from '../../theme/variables/airbitz'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'

interface OwnProps extends EdgeSceneProps<'otpRepair'> {}

interface StateProps {
  account: EdgeAccount
  context: EdgeContext
}
type Props = OwnProps & StateProps

class OtpRepairComponent extends React.Component<Props> {
  render() {
    const { context, account, navigation, route } = this.props
    const { otpError } = route.params
    const handleComplete = () => navigation.goBack()

    return (
      <View style={styles.container}>
        <OtpRepairScreen account={account} branding={{ appName: config.appName }} context={context} onComplete={handleComplete} otpError={otpError} />
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

export const OtpRepairScene = connect<StateProps, {}, OwnProps>(
  state => ({
    context: state.core.context,
    account: state.core.account
  }),
  dispatch => ({})
)(OtpRepairComponent)
