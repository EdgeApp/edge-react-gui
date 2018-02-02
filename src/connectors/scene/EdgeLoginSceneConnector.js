// @flow

import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'

// import * as Constants from '../../constants/indexConstants'
import * as actions from '../../actions/indexActions'
import LinkedComponent
  from '../../modules/UI/scenes/EdgeLogin/EdgeLoginSceneComponent'
import {EdgeLoginScreen} from '../../styles/indexStyles'

import type {Dispatch, State} from '../../modules/ReduxTypes'

import {getLobby, getError, getIsProcessing} from '../../modules/Core/selectors'

export const mapStateToProps = (state: State) => ({
  style: EdgeLoginScreen,
  lobby: getLobby(state),
  error: getError(state),
  isProcessing: getIsProcessing(state)
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  // $FlowFixMe
  accept: () => dispatch(actions.lobbyLogin()).catch((e) => { console.log(e) }),
  decline: () => Actions.pop()
})

export default connect(mapStateToProps, mapDispatchToProps)(LinkedComponent)
