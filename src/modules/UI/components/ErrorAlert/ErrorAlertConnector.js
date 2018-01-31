// @flow

import {connect} from 'react-redux'

import ErrorAlert from './ErrorAlert.ui'
import {dismissErrorAlert} from './actions.js'

import {getDisplayAlert, getMessage} from './selectors.js'

import type {
  State,
  Dispatch
} from '../../../ReduxTypes'

const mapStateToProps = (state: State) => ({
  displayAlert: getDisplayAlert(state),
  message: getMessage(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dismissAlert: () => dispatch(dismissErrorAlert())
})

export default connect(mapStateToProps, mapDispatchToProps)(ErrorAlert)
