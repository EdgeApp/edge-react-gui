// @flow

import {connect} from 'react-redux'

import CurrencySettings from './CurrencySettings.ui'
import {
  getPlugin,
  getDenominations,
  getDisplayDenominationKey
} from '../../Settings/selectors'
import {setDenominationKeyRequest} from './action'

import type {Dispatch, State} from '../../../ReduxTypes'

const mapStateToProps = (state: State, ownProps: Object) => ({
  logo: getPlugin(state, ownProps.pluginName).currencyInfo.symbolImage,
  denominations: getDenominations(state, ownProps.currencyCode),
  selectedDenominationKey: getDisplayDenominationKey(state, ownProps.currencyCode)
})
const mapDispatchToProps = (dispatch: Dispatch, ownProps: Object) => ({
  selectDenomination: (denominationKey) => { dispatch(setDenominationKeyRequest(ownProps.currencyCode, denominationKey)) }
})
export default connect(mapStateToProps, mapDispatchToProps)(CurrencySettings)
