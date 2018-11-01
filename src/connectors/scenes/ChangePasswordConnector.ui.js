// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import ChangePasswordComponent from '../../components/scenes/ChangePasswordScene'
import type { ChangePasswordDispatchProps, ChangePasswordOwnProps, ChangePasswordStateProps } from '../../components/scenes/ChangePasswordScene'
import * as CORE_SELECTORS from '../../modules/Core/selectors.js'
import type { State } from '../../modules/ReduxTypes'

export const mapStateToProps = (state: State, ownProps: ChangePasswordOwnProps): ChangePasswordStateProps => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state),
  showHeader: false
})

export const mapDispatchToProps = (dispatch: Dispatch): ChangePasswordDispatchProps => ({
  onComplete: Actions.pop
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangePasswordComponent)
