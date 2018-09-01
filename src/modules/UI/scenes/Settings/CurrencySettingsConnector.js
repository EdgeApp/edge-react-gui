// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import { setDenominationKeyRequest } from './action'
import CurrencySettings from './CurrencySettings.ui'

const mapStateToProps = (state: State, ownProps) => ({
  logo: SETTINGS_SELECTORS.getPluginInfo(state, ownProps.pluginName).symbolImage,
  denominations: SETTINGS_SELECTORS.getDenominations(state, ownProps.currencyCode),
  selectedDenominationKey: SETTINGS_SELECTORS.getDisplayDenominationKey(state, ownProps.currencyCode)
})
const mapDispatchToProps = (dispatch: Dispatch, ownProps) => ({
  selectDenomination: denominationKey => {
    dispatch(setDenominationKeyRequest(ownProps.currencyCode, denominationKey))
  }
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrencySettings)
