// @flow

import {connect} from 'react-redux'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {Actions} from 'react-native-router-flux'
import ChangePasswordComponent from './ChangePasswordComponent.ui'
import type {AbcContext, AbcAccount} from 'airbitz-core-types'

import type {State} from '../../../ReduxTypes'

export type DispatchProps = {
  onComplete: () => void
}

export type StateProps = {
  context: AbcContext,
  account: AbcAccount,
  showHeader: boolean
}

export type OwnProps = {
  showHeader: boolean
}

export const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state),
  showHeader: false
})

export const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onComplete: Actions.pop
})

export default connect(mapStateToProps, mapDispatchToProps)(ChangePasswordComponent)
