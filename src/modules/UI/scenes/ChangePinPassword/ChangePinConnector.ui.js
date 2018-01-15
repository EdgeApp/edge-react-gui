// @flow

import {connect} from 'react-redux'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {Actions} from 'react-native-router-flux'
// eslint-disable-next-line no-duplicate-imports
import ChangePinComponent from './ChangePinComponent.ui'
// eslint-disable-next-line no-duplicate-imports
import type {
  ChangePinOwnProps,
  ChangePinStateProps,
  ChangePinDispatchProps
} from './ChangePinComponent.ui'

import type {AbcContext, AbcAccount} from 'airbitz-core-types'

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
