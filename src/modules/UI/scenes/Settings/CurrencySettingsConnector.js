import { connect } from 'react-redux'

import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import { setDenominationKeyRequest } from './action'
import CurrencySettings from './CurrencySettings.ui'

const mapStateToProps = (state, ownProps) => ({
  logo: SETTINGS_SELECTORS.getPlugin(state, ownProps.pluginName).currencyInfo.symbolImage,
  denominations: SETTINGS_SELECTORS.getDenominations(state, ownProps.currencyCode),
  selectedDenominationKey: SETTINGS_SELECTORS.getDisplayDenominationKey(state, ownProps.currencyCode)
})
const mapDispatchToProps = (dispatch, ownProps) => ({
  selectDenomination: denominationKey => {
    dispatch(setDenominationKeyRequest(ownProps.currencyCode, denominationKey))
  }
})
export default connect(mapStateToProps, mapDispatchToProps)(CurrencySettings)
