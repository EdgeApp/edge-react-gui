import {connect} from 'react-redux'
import Header from './Header.ui'

const mapStateToProps = (state) => ({
  routes: state.routes,
  stackDepth: state.routes.stackDepth,
  sceneTitle: state.routes.scene.title
})

export default connect(mapStateToProps)(Header)
