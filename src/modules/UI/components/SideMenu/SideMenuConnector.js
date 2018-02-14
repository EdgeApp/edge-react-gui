import { connect } from 'react-redux'

import { closeSideMenu, openSideMenu } from './action'
import SideMenu from './SideMenu.ui'

const mapStateToProps = state => ({
  view: state.ui.scenes.sideMenu.view
})
const mapDispatchToProps = dispatch => ({
  open: () => dispatch(openSideMenu()),
  close: () => dispatch(closeSideMenu())
})
export default connect(mapStateToProps, mapDispatchToProps)(SideMenu)
