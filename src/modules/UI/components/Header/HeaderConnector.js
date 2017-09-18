import {connect} from 'react-redux'
import Header from './Header.ui'
import {setHeaderHeight} from '../../dimensions/action'

const mapStateToProps = (state) => ({
  routes: state.routes,
  stackDepth: state.routes.stackDepth,
  sceneTitle: state.routes.scene.title
})
const mapDispatchToProps = (dispatch) => ({
  setHeaderHeight: (headerHeight) => dispatch(setHeaderHeight(headerHeight))
})
export default connect(mapStateToProps, mapDispatchToProps)(Header)
