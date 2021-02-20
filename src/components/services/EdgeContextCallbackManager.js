// @flow

import { type EdgeContext, type OtpError } from 'edge-core-js'
import * as React from 'react'
import { connect } from 'react-redux'

import { handleOtpError } from '../../actions/AccountActions.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { AlertDropdown } from '../navigation/AlertDropdown.js'
import { Airship } from './AirshipInstance.js'

type StateProps = {
  context: EdgeContext
}
type DispatchProps = {
  onOtpError: (otpError: OtpError) => void
}

type Props = StateProps & DispatchProps

class EdgeContextCallbackManager extends React.Component<Props> {
  cleanups: Array<() => mixed> = []

  constructor(props: Props) {
    super(props)
    const { context } = props

    let errorShown = false
    this.cleanups.push(
      context.on('error', (error: mixed) => {
        console.log(error)

        if (error instanceof Error && error.name === 'OtpError') {
          return this.props.onOtpError(error)
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

  showError(error: mixed): Promise<void> {
    // TODO: Run the errors through our translation infrastructure:
    const message = error instanceof Error ? error.message : String(error)

    return Airship.show(bridge => <AlertDropdown bridge={bridge} message={message} warning />)
  }

  render() {
    return null
  }
}

export default connect(
  (state: RootState): StateProps => ({
    account: state.core.account,
    context: state.core.context
  }),
  (dispatch: Dispatch) => ({
    onOtpError(otpError: OtpError) {
      dispatch(handleOtpError(otpError))
    }
  })
)(EdgeContextCallbackManager)
