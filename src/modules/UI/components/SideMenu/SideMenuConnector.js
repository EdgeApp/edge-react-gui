import {connect} from 'react-redux'
import SideMenu from './SideMenu.ui'
import {openSideMenu, closeSideMenu} from './action'

const mapStateToProps = (state) => ({
  view: state.ui.scenes.sideMenu.view
})
const mapDispatchToProps = (dispatch) => ({
  open: () => dispatch(openSideMenu()),
  close: () => dispatch(closeSideMenu())
})
export default connect(mapStateToProps, mapDispatchToProps)(SideMenu)
