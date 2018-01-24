// @flow

import {connect} from 'react-redux'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {Actions} from 'react-native-router-flux'
import ChangePasswordComponent, {
  type ChangePasswordDispatchProps,
  type ChangePasswordStateProps,
  type ChangePasswordOwnProps
} from './ChangePasswordComponent.ui'

import type {State} from '../../../ReduxTypes'

export const mapStateToProps = (state: State, ownProps: ChangePasswordOwnProps): ChangePasswordStateProps => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state),
  showHeader: false
})

export const mapDispatchToProps = (dispatch: Dispatch): ChangePasswordDispatchProps => ({
  onComplete: Actions.pop
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangePasswordComponent)
