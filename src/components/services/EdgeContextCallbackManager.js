// @flow

import type { EdgeContext } from 'edge-core-js'
import React from 'react'
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../types/reduxTypes.js'
import { AlertDropdown } from '../navigation/AlertDropdown.js'
import { Airship } from './AirshipInstance.js'

type EdgeContextCallbackManagerStateProps = {
  context: EdgeContext
}

type Props = EdgeContextCallbackManagerStateProps

class EdgeContextCallbackManager extends React.Component<Props> {
  componentDidUpdate (oldProps: Props) {
    if (this.props.context && this.props.context !== oldProps.context) {
      const { context } = this.props

      context.on('error', (error: mixed) => {
        console.log(error)

        // TODO: Run the errors through our translation infrastructure:
        const message = error instanceof Error ? error.message : String(error)

        return Airship.show(bridge => <AlertDropdown bridge={bridge} message={message} warning />)
      })
    }
  }

  render () {
    return null
  }
}

const mapStateToProps = (state: State): EdgeContextCallbackManagerStateProps => ({
  context: state.core.context.context
})

const mapDispatchToProps = (dispatch: Dispatch) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EdgeContextCallbackManager)
