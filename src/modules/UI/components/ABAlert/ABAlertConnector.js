// @flow

import { connect } from 'react-redux'

import * as actions from '../../../../actions/indexActions'
import * as Constants from '../../../../constants/indexConstants'
import type { Dispatch, State } from '../../../ReduxTypes.js'
import ABAlert from './ABAlert.ui'

const mapStateToProps = (state: State) => ({
  view: state.ui.scenes.ABAlert.view,
  title: state.ui.scenes.ABAlert.syntax.title,
  message: state.ui.scenes.ABAlert.syntax.message,
  buttons: state.ui.scenes.ABAlert.syntax.buttons,
  route: state.ui.scenes.ABAlert.route
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  closeAlert: () => dispatch(actions.dispatchAction(Constants.CLOSE_AB_ALERT))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ABAlert)
