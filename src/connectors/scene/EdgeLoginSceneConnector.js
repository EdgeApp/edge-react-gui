// @flow

import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'

import * as actions from '../../actions/indexActions'
import LinkedComponent
  from '../../modules/UI/scenes/EdgeLogin/EdgeLoginSceneComponent'
import {EdgeLoginScreen} from '../../styles/indexStyles'
import type {State, Dispatch} from '../../modules/ReduxTypes.js'

export const mapStateToProps = (state: State) => ({
  style: EdgeLoginScreen,
  lobby: state.core.edgeLogin.lobby,
  error: state.core.edgeLogin.error,
  isProcessing: state.core.edgeLogin.isProcessing
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  // $FlowFixMe
  accept: () => dispatch(actions.lobbyLogin()).catch((e) => { console.log(e) }),
  decline: () => Actions.pop()
})

export default connect(mapStateToProps, mapDispatchToProps)(LinkedComponent)
