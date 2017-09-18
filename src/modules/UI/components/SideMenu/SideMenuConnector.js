import {connect} from 'react-redux'
import SideMenu from './SideMenu.ui'
import {openSidebar, closeSidebar} from './action'

const mapStateToProps = (state) => ({
  view: state.ui.scenes.sideMenu.view
})
const mapDispatchToProps = (dispatch) => ({
  open: () => dispatch(openSidebar()),
  close: () => dispatch(closeSidebar())
})
export default connect(mapStateToProps, mapDispatchToProps)(SideMenu)
