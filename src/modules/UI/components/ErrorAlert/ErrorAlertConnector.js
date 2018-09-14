// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes'
import { dismissErrorAlert } from './actions.js'
import ErrorAlert from './ErrorAlert.ui'

const mapStateToProps = (state: State) => ({
  displayAlert: state.ui.errorAlert.displayAlert,
  message: state.ui.errorAlert.message
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dismissAlert: () => dispatch(dismissErrorAlert())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ErrorAlert)
