import {connect} from 'react-redux'
import Main from './Main'
import {logoutRequest} from '../../../../Login/action'
import {closeSideMenu} from '../../SideMenu/action'

const mapStateToProps = (state) => ({
  usersView: state.ui.scenes.controlPanel.usersView
})
const mapDispatchToProps = (dispatch) => ({
  onPressOption: () => dispatch(closeSideMenu()),
  logout:        () => dispatch(logoutRequest(null))
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
