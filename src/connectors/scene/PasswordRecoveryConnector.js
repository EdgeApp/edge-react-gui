// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import * as CORE_SELECTORS from '../../modules/Core/selectors.js'
import type { State } from '../../modules/ReduxTypes'
import PasswordRecoveryComponent from '../../modules/UI/scenes/PasswordRecovery/PasswordRecoveryComponent.ui.js'

export const mapStateToProps = (state: State) => ({
  context: CORE_SELECTORS.getContext(state),
  account: CORE_SELECTORS.getAccount(state),
  showHeader: false
})

export const mapDispatchToProps = () => ({
  onComplete: Actions.pop
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PasswordRecoveryComponent)
