// @flow
import ABAlert from './ABAlert.ui'
import {connect} from 'react-redux'
import {closeABAlert} from './action.js'

import type {
  State,
  Dispatch
} from '../../../ReduxTypes.js'

const mapStateToProps = (state: State) => ({
  view: state.ui.scenes.ABAlert.view,
  title: state.ui.scenes.ABAlert.syntax.title,
  message: state.ui.scenes.ABAlert.syntax.message,
  buttons: state.ui.scenes.ABAlert.syntax.buttons,
  route: state.ui.scenes.ABAlert.route
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  closeAlert: () => dispatch(closeABAlert())
})

export default connect(mapStateToProps, mapDispatchToProps)(ABAlert)
