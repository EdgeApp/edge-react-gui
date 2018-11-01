// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import ChangePinComponent from '../../components/scenes/ChangePinScene'
import type { ChangePinDispatchProps, ChangePinOwnProps, ChangePinStateProps } from '../../components/scenes/ChangePinScene'
import * as CORE_SELECTORS from '../../modules/Core/selectors.js'
import type { State } from '../../modules/ReduxTypes'

export const mapStateToProps = (state: State, ownProps: ChangePinOwnProps): ChangePinStateProps => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state),
  showHeader: false
})

export const mapDispatchToProps = (dispatch: Dispatch): ChangePinDispatchProps => ({
  onComplete: Actions.pop
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangePinComponent)
