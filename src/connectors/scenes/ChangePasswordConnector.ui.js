// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import type { ChangePasswordDispatchProps, ChangePasswordOwnProps, ChangePasswordStateProps } from '../../components/scenes/ChangePasswordScene'
import ChangePasswordComponent from '../../components/scenes/ChangePasswordScene'
import type { State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State, ownProps: ChangePasswordOwnProps): ChangePasswordStateProps => ({
  context: state.core.context,
  account: state.core.account,
  showHeader: false
})

export const mapDispatchToProps = (dispatch: Dispatch): ChangePasswordDispatchProps => ({
  onComplete: Actions.pop
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangePasswordComponent)
