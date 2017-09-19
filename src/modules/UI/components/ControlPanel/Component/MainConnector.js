import {connect} from 'react-redux'
import {logoutRequest} from '../../../../Login/action'
import Main from './Main'
import {closeSideMenu} from '../../SideMenu/action'

const mapStateToProps = (state) => ({
  usersView: state.ui.scenes.controlPanel.usersView
})
const mapDispatchToProps = (dispatch) => ({
  closeSideMenu: () => dispatch(closeSideMenu()),
  logout: () => dispatch(logoutRequest())
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
