import {connect} from 'react-redux'
import Layout from './Layout.ui'
import {logoutRequest} from '../../components/ControlPanel/action'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'

const mapStateToProps = (state) => ({
  autoLogoutTimeInSeconds: SETTINGS_SELECTORS.getAutoLogoutTimeInSeconds(state)
})
const mapDispatchToProps = (dispatch) => ({
  logout: () => dispatch(logoutRequest())
})

export default connect(mapStateToProps, mapDispatchToProps)(Layout)
