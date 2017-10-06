// @flow
import type {Dispatch, State} from '../../../ReduxTypes'
import {connect} from 'react-redux'
import DropdownAlert from './DropdownAlert.ui'
import {dismissDropdownAlert} from './actions'
import * as UI_SELECTORS from '../../selectors'

const mapStateToProps = (state: State) => ({
  ...UI_SELECTORS.getDropdownAlertState(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  dismissDropdownAlert: () => dispatch(dismissDropdownAlert())
})

export default connect(mapStateToProps, mapDispatchToProps)(DropdownAlert)
