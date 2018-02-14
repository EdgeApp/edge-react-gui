import { Actions } from 'react-native-router-flux'
// @flow
import { connect } from 'react-redux'

// import * as Constants from '../../constants/indexConstants'
import * as actions from '../../actions/indexActions'
import LinkedComponent from '../../modules/UI/scenes/EdgeLogin/EdgeLoginSceneComponent'
import { EdgeLoginScreen } from '../../styles/indexStyles'

export const mapStateToProps = (state: any) => ({
  style: EdgeLoginScreen,
  lobby: state.core.edgeLogin.lobby,
  error: state.core.edgeLogin.error,
  isProcessing: state.core.edgeLogin.isProcessing
})

export const mapDispatchToProps = (dispatch: any) => ({
  accept: () =>
    dispatch(actions.lobbyLogin()).catch(e => {
      console.log(e)
    }),
  decline: () => Actions.pop()
})

export default connect(mapStateToProps, mapDispatchToProps)(LinkedComponent)
