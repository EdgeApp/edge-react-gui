// @flow

import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'

import {getContext, getAccount} from '../../modules/Core/selectors.js'
import PasswordRecoveryComponent from '../../modules/UI/scenes/PasswordRecovery/PasswordRecoveryComponent.ui.js'

import type {State} from '../../modules/ReduxTypes'

export const mapStateToProps = (state: State) => ({
  context: getContext(state),
  account: getAccount(state),
  showHeader: false
})

export const mapDispatchToProps = () => ({
  onComplete: Actions.pop
})

export default connect(mapStateToProps, mapDispatchToProps)(PasswordRecoveryComponent)
