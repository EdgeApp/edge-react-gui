// @flow

import {connect} from 'react-redux'

import ABAlert from './ABAlert.ui'
import * as actions from '../../../../actions/indexActions'
import * as Constants from '../../../../constants/indexConstants'
import type {
  Dispatch,
  State
} from '../../../ReduxTypes.js' // Dispatch was left out beacuse it causes a cascade
// of problems

import {
  getView,
  getTitle,
  getMessage,
  getButtons,
  getRoute
} from './selectors.js'

const mapStateToProps = (state: State) => ({
  view: getView(state),
  title: getTitle(state),
  message: getMessage(state),
  buttons: getButtons(state),
  route: getRoute(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  closeAlert: () => dispatch(actions.dispatchAction(Constants.CLOSE_AB_ALERT))
})

export default connect(mapStateToProps, mapDispatchToProps)(ABAlert)
