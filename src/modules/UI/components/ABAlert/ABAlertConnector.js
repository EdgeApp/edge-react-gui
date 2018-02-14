import { connect } from 'react-redux'

import * as actions from '../../../../actions/indexActions'
import * as Constants from '../../../../constants/indexConstants'
import type { State } from '../../../ReduxTypes.js'
// @flow
import ABAlert from './ABAlert.ui'

// Dispatch was left out beacuse it causes a cascade
// of problems

const mapStateToProps = (state: State) => ({
  view: state.ui.scenes.ABAlert.view,
  title: state.ui.scenes.ABAlert.syntax.title,
  message: state.ui.scenes.ABAlert.syntax.message,
  buttons: state.ui.scenes.ABAlert.syntax.buttons,
  route: state.ui.scenes.ABAlert.route
})

const mapDispatchToProps = (dispatch: any) => ({
  closeAlert: () => dispatch(actions.dispatchAction(Constants.CLOSE_AB_ALERT))
})

export default connect(mapStateToProps, mapDispatchToProps)(ABAlert)
