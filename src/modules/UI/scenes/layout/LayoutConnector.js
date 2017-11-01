import {connect} from 'react-redux'
import Layout from './Layout.ui'
import {logoutRequest} from '../../../Login/action'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import {updateExchangeRates} from '../../../ExchangeRates/action'

const mapStateToProps = (state) => ({
  autoLogoutTimeInSeconds: SETTINGS_SELECTORS.getAutoLogoutTimeInSeconds(state)
})
const mapDispatchToProps = (dispatch) => ({
  autoLogout: () => dispatch(logoutRequest(null)),
  updateExchangeRates: () => { dispatch(updateExchangeRates()) }
})

export default connect(mapStateToProps, mapDispatchToProps)(Layout)
