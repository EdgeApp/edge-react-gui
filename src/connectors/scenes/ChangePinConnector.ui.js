// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import type { ChangePinDispatchProps, ChangePinOwnProps, ChangePinStateProps } from '../../components/scenes/ChangePinScene'
import ChangePinComponent from '../../components/scenes/ChangePinScene'
import type { State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State, ownProps: ChangePinOwnProps): ChangePinStateProps => ({
  context: state.core.context,
  account: state.core.account,
  showHeader: false
})

export const mapDispatchToProps = (dispatch: Dispatch): ChangePinDispatchProps => ({
  onComplete: Actions.pop
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangePinComponent)
