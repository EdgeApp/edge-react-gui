import {connect} from 'react-redux'
import {logoutRequest} from '../../../../Login/action'
import Main from './Main'

const mapStateToProps = (state) => ({
  usersView: state.ui.scenes.controlPanel.usersView
})
const mapDispatchToProps = (dispatch) => ({
  logout: () => dispatch(logoutRequest())
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
