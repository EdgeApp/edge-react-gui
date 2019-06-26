// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes.js'
import ABAlert from './ABAlert.ui'

const mapStateToProps = (state: State) => ({
  view: state.ui.scenes.ABAlert.view,
  title: state.ui.scenes.ABAlert.syntax.title,
  message: state.ui.scenes.ABAlert.syntax.message,
  buttons: state.ui.scenes.ABAlert.syntax.buttons
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  closeAlert: () => dispatch({ type: 'CLOSE_AB_ALERT' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ABAlert)
