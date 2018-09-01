// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import * as actions from '../../actions/indexActions'
import type { Dispatch, State } from '../../modules/ReduxTypes.js'
import LinkedComponent from '../../modules/UI/scenes/EdgeLogin/EdgeLoginSceneComponent'
import { EdgeLoginScreen } from '../../styles/indexStyles'

export const mapStateToProps = (state: State) => ({
  style: EdgeLoginScreen,
  lobby: state.core.edgeLogin.lobby,
  error: state.core.edgeLogin.error,
  isProcessing: state.core.edgeLogin.isProcessing
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  accept: () =>
    // $FlowFixMe
    dispatch(actions.lobbyLogin()).catch(e => {
      console.log(e)
    }),
  decline: () => Actions.pop()
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkedComponent)
