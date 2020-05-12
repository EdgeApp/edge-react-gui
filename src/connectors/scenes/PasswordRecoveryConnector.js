// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import PasswordRecoveryComponent from '../../components/scenes/PasswordRecoveryScene.js'
import type { State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State) => ({
  context: state.core.context,
  account: state.core.account,
  showHeader: false
})

export const mapDispatchToProps = () => ({
  onComplete: Actions.pop
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PasswordRecoveryComponent)
