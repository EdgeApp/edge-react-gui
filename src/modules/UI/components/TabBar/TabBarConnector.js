import {connect} from 'react-redux'
import TabBar from './TabBar.ui'

const mapStateToProps = (state) => ({
  sidemenu: state.ui.scenes.sideMenu.view,
  routes: state.routes
})

export default connect(mapStateToProps)(TabBar)
