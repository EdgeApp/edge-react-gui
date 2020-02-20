// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { lobbyLogin } from '../../actions/EdgeLoginActions.js'
import LinkedComponent from '../../components/scenes/EdgeLoginScene'
import type { Dispatch, State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State) => ({
  lobby: state.core.edgeLogin.lobby,
  error: state.core.edgeLogin.error,
  isProcessing: state.core.edgeLogin.isProcessing
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  accept: () => dispatch(lobbyLogin()),
  decline: () => Actions.pop()
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkedComponent)
