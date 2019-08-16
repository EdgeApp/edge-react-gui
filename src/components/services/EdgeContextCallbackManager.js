// @flow

import type { EdgeContext } from 'edge-core-js'
import React from 'react'
import { connect } from 'react-redux'

import { displayErrorAlert } from '../../modules/UI/components/ErrorAlert/actions'
import type { Dispatch, State } from '../../types/reduxTypes.js'

type EdgeContextCallbackManagerStateProps = {
  context: EdgeContext
}

type EdgeContextCallbackManagerDispatchProps = {
  displayErrorAlert: (error: Error) => any
}

type Props = EdgeContextCallbackManagerStateProps & EdgeContextCallbackManagerDispatchProps

class EdgeContextCallbackManager extends React.Component<Props> {
  componentDidUpdate (oldProps: Props) {
    if (this.props.context && this.props.context !== oldProps.context) {
      const { context } = this.props

      context.on('error', (error: Error) => {
        this.props.displayErrorAlert(error)
      })
    }
  }

  render () {
    return null
  }
}

const mapStateToProps = (state: State): EdgeContextCallbackManagerStateProps => {
  return {
    context: state.core.context.context
  }
}

const mapDispatchToProps = (dispatch: Dispatch): EdgeContextCallbackManagerDispatchProps => {
  return {
    displayErrorAlert: error => dispatch(displayErrorAlert(error))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EdgeContextCallbackManager)
