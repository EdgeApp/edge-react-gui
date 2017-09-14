import {connect} from 'react-redux'
import Layout from './Layout.ui'
import {logoutRequest} from '../../../Login/action'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'

const mapStateToProps = (state) => ({
  autoLogoutTimeInSeconds: SETTINGS_SELECTORS.getAutoLogoutTimeInSeconds(state)
})
const mapDispatchToProps = (dispatch) => ({
  autoLogout: () => dispatch(logoutRequest())
})

export default connect(mapStateToProps, mapDispatchToProps)(Layout)
