// @flow

import type { EdgeContext } from 'edge-core-js'
import React from 'react'
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../types/reduxTypes.js'
import { AlertDropdown } from '../navigation/AlertDropdown.js'
import { Airship } from './AirshipInstance.js'

type StateProps = {
  context: EdgeContext
}

type Props = StateProps

class EdgeContextCallbackManager extends React.Component<Props> {
  cleanups: Array<() => mixed> = []

  constructor (props: Props) {
    super(props)
    const { context } = props

    let errorShown = false
    this.cleanups.push(
      context.on('error', (error: mixed) => {
        console.log(error)

        if (!errorShown) {
          errorShown = true
          this.showError(error).then(() => {
            errorShown = false
          })
        }
      })
    )
  }

  componentWillUnmount () {
    for (const cleanup of this.cleanups) cleanup()
  }

  showError (error: mixed): Promise<void> {
    // TODO: Run the errors through our translation infrastructure:
    const message = error instanceof Error ? error.message : String(error)

    return Airship.show(bridge => <AlertDropdown bridge={bridge} message={message} warning />)
  }

  render () {
    return null
  }
}

export default connect(
  (state: State): StateProps => ({
    context: state.core.context.context
  }),
  (dispatch: Dispatch) => ({})
)(EdgeContextCallbackManager)
