// @flow

import { type EdgeContext, type OtpError, asMaybeOtpError } from 'edge-core-js'
import * as React from 'react'

import { handleOtpError } from '../../actions/AccountActions.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, withNavigation } from '../../types/routerTypes.js'
import { makeErrorLog, translateError } from '../../util/translateError.js'
import { AlertDropdown } from '../navigation/AlertDropdown.js'
import { Airship, yellowText } from './AirshipInstance.js'

type StateProps = {
  context: EdgeContext
}
type DispatchProps = {
  onOtpError: (otpError: OtpError, navigation: NavigationProp<'edgeContextCallbackManagerComponent'>) => void
}
type OwnProps = {
  navigation: NavigationProp<'edgeContextCallbackManagerComponent'>
}

type Props = StateProps & DispatchProps & OwnProps

class EdgeContextCallbackManagerComponent extends React.Component<Props> {
  cleanups: Array<() => mixed> = []

  constructor(props: Props) {
    super(props)
    const { context, navigation } = props

    let errorShown = false
    this.cleanups.push(
      context.on('error', (error: mixed) => {
        console.log(error)

        const otpError = asMaybeOtpError(error)
        if (otpError != null) {
          return this.props.onOtpError(otpError, navigation)
        }

        if (!errorShown) {
          errorShown = true
          this.showError(error).then(() => {
            errorShown = false
          })
        }
      })
    )
  }

  componentWillUnmount() {
    for (const cleanup of this.cleanups) cleanup()
  }

  /**
   * Like AirshipInstance/showWarning,
   * but asynchronous so we don't spam multiple pop-ups.
   */
  showError(error: mixed): Promise<void> {
    console.log(yellowText('Showing core drop-down alert: ' + makeErrorLog(error)))
    return Airship.show(bridge => <AlertDropdown bridge={bridge} message={translateError(error)} warning />)
  }

  render() {
    return null
  }
}

export const EdgeContextCallbackManager = connect<StateProps, DispatchProps, OwnProps, {}>(
  state => ({
    account: state.core.account,
    context: state.core.context
  }),
  (dispatch, props) => ({
    onOtpError(otpError: OtpError, navigation: NavigationProp<'edgeContextCallbackManagerComponent'>) {
      dispatch(handleOtpError(otpError))
    }
  })
)(withNavigation(EdgeContextCallbackManagerComponent))
