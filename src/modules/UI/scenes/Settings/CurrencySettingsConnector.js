// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import { setDenominationKeyRequest, toggleEnableCustomNodes, saveCustomNodesList } from './action'
import CurrencySettings from './CurrencySettings.ui'

const mapStateToProps = (state: State, ownProps) => ({
  logo: SETTINGS_SELECTORS.getPlugin(state, ownProps.pluginName).currencyInfo.symbolImage,
  denominations: SETTINGS_SELECTORS.getDenominations(state, ownProps.currencyCode),
  selectedDenominationKey: SETTINGS_SELECTORS.getDisplayDenominationKey(state, ownProps.currencyCode),
  isCustomNodesEnabled: state.ui.settings[ownProps.currencyCode].isCustomNodesEnabled,
  customNodesList: state.ui.settings[ownProps.currencyCode].customNodesList
})
const mapDispatchToProps = (dispatch: Dispatch, ownProps) => ({
  selectDenomination: denominationKey => {
    dispatch(setDenominationKeyRequest(ownProps.currencyCode, denominationKey))
  },
  toggleEnableCustomNodes: () => dispatch(toggleEnableCustomNodes(ownProps.currencyCode)),
  saveCustomNodesList: (customNodesList: Array<string>) => dispatch(saveCustomNodesList(ownProps.currencyCode, customNodesList))
})
export default connect(mapStateToProps, mapDispatchToProps)(CurrencySettings)
