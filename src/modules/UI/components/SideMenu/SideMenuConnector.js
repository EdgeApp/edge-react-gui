import {connect} from 'react-redux'

import SideMenu from './SideMenu.ui'
import {openSideMenu, closeSideMenu} from './action'

import {getView} from './selectors.js'

const mapStateToProps = (state) => ({
  view: getView(state)
})
const mapDispatchToProps = (dispatch) => ({
  open: () => dispatch(openSideMenu()),
  close: () => dispatch(closeSideMenu())
})
export default connect(mapStateToProps, mapDispatchToProps)(SideMenu)
