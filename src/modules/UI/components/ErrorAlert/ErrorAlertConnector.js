// @flow
import ErrorAlert from './ErrorAlert.ui'
import {connect} from 'react-redux'
import {dismissErrorAlert} from './actions.js'

import type {
  State,
  Dispatch
} from '../../../ReduxTypes'

const mapStateToProps = (state: State) => ({
  displayAlert: state.ui.errorAlert.displayAlert,
  message: state.ui.errorAlert.message
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dismissAlert: () => dispatch(dismissErrorAlert())
})

export default connect(mapStateToProps, mapDispatchToProps)(ErrorAlert)
