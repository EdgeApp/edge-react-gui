import {connect} from 'react-redux'
import DefaultFiatSetting from './DefaultFiatSetting.ui.ui'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import {setDenominationKeyRequest} from './action'

const mapStateToProps = (state, ownProps) => ({
  defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state)
})
const mapDispatchToProps = (dispatch, ownProps) => ({
  selectDenomination: (denominationKey) => { dispatch(setDenominationKeyRequest(ownProps.currencyCode, denominationKey)) },
})
export default connect(mapStateToProps, mapDispatchToProps)(CurrencySettings)
