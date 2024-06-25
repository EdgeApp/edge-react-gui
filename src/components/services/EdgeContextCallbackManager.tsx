import { asMaybeOtpError, EdgeContext, OtpError } from 'edge-core-js'
import * as React from 'react'

import { handleOtpError } from '../../actions/AccountActions'
import { connect } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { showDevError, showDevErrorAsync } from './AirshipInstance'

interface OwnProps {
  navigation: NavigationBase
}
interface StateProps {
  context: EdgeContext
}
interface DispatchProps {
  onOtpError: (navigation: NavigationBase, otpError: OtpError) => void
}

type Props = OwnProps & StateProps & DispatchProps

class EdgeContextCallbackManagerComponent extends React.Component<Props> {
  cleanups: Array<() => unknown> = []

  constructor(props: Props) {
    super(props)
    const { context } = props

    let errorShown = false
    this.cleanups.push(
      context.on('error', (error: unknown) => {
        console.log(error)

        const otpError = asMaybeOtpError(error)
        if (otpError != null) {
          return this.props.onOtpError(this.props.navigation, otpError)
        }

        if (!errorShown) {
          errorShown = true
          showDevErrorAsync(error)
            .then(() => {
              errorShown = false
            })
            .catch(err => showDevError(err))
        }
      })
    )
  }

  componentWillUnmount() {
    for (const cleanup of this.cleanups) cleanup()
  }

  render() {
    return null
  }
}

export const EdgeContextCallbackManager = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    account: state.core.account,
    context: state.core.context
  }),
  dispatch => ({
    onOtpError(navigation: NavigationBase, otpError: OtpError) {
      dispatch(handleOtpError(navigation, otpError))
    }
  })
)(EdgeContextCallbackManagerComponent)
