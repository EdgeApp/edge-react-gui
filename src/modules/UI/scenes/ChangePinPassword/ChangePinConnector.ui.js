// @flow

import {connect} from 'react-redux'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {Actions} from 'react-native-router-flux'
import ChangePinComponent, {
  type ChangePinOwnProps,
  type ChangePinStateProps,
  type ChangePinDispatchProps
} from './ChangePinComponent.ui'

import type {State} from '../../../ReduxTypes'

export const mapStateToProps = (state: State, ownProps: ChangePinOwnProps): ChangePinStateProps => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state),
  showHeader: false
})

export const mapDispatchToProps = (dispatch: Dispatch): ChangePinDispatchProps => ({
  onComplete: Actions.pop
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangePinComponent)
