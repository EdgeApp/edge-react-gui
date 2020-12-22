// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import PasswordRecoveryComponent from '../../components/scenes/PasswordRecoveryScene.js'
import { type RootState } from '../../types/reduxTypes.js'

const mapStateToProps = (state: RootState) => ({
  context: state.core.context,
  account: state.core.account,
  showHeader: false
})

const mapDispatchToProps = () => ({
  onComplete: Actions.pop
})

export default connect(mapStateToProps, mapDispatchToProps)(PasswordRecoveryComponent)
