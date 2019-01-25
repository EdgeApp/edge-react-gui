// @flow

import type { EdgeContext } from 'edge-core-js'
import React from 'react'
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../modules/ReduxTypes.js'
import { displayErrorAlert } from '../../modules/UI/components/ErrorAlert/actions'

type EdgeContextCallbackManagerStateProps = {
  context: EdgeContext
}

type EdgeContextCallbackManagerDispatchProps = {
  displayErrorAlert: (message: string) => any
}

type Props = EdgeContextCallbackManagerStateProps & EdgeContextCallbackManagerDispatchProps

class EdgeContextCallbackManager extends React.Component<Props> {
  render () {
    return null
  }

  componentDidUpdate () {
    if (this.props.context) this.subscribeToContext()
  }

  subscribeToContext = () => {
    const { context } = this.props

    context.on('error', (error: Error) => {
      console.log(error)
      this.props.displayErrorAlert(error.message)
    })
  }
}

const mapStateToProps = (state: State): EdgeContextCallbackManagerStateProps => {
  return {
    context: state.core.context.context
  }
}

const mapDispatchToProps = (dispatch: Dispatch): EdgeContextCallbackManagerDispatchProps => {
  return {
    displayErrorAlert: errorMessage => dispatch(displayErrorAlert(errorMessage))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EdgeContextCallbackManager)
