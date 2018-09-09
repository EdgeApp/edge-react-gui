// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import { disableCustomNodes, enableCustomNodes, saveCustomNodesList, setDenominationKeyRequest, updateIsSetCustomNodesModalVisible } from './action'
import CurrencySettings from './CurrencySettings.ui'

const mapStateToProps = (state: State, ownProps) => ({
  logo: SETTINGS_SELECTORS.getPluginInfo(state, ownProps.pluginName).symbolImage,
  denominations: SETTINGS_SELECTORS.getDenominations(state, ownProps.currencyCode),
  selectedDenominationKey: SETTINGS_SELECTORS.getDisplayDenominationKey(state, ownProps.currencyCode),
  isCustomNodesEnabled: state.ui.settings[ownProps.currencyCode].customNodes.isEnabled || false,
  customNodesList: state.ui.settings[ownProps.currencyCode].customNodes.nodesList || [],
  isSetCustomNodesModalVisible: state.ui.scenes.settings.isSetCustomNodesModalVisible
})
const mapDispatchToProps = (dispatch: Dispatch, ownProps) => ({
  selectDenomination: denominationKey => {
    dispatch(setDenominationKeyRequest(ownProps.currencyCode, denominationKey))
  },
  enableCustomNodes: () => dispatch(enableCustomNodes(ownProps.currencyCode)),
  disableCustomNodes: () => dispatch(disableCustomNodes(ownProps.currencyCode)),
  setCustomNodesModalVisibility: (visibility: boolean) => dispatch(updateIsSetCustomNodesModalVisible(visibility)),
  saveCustomNodesList: (nodesList: Array<string>) => dispatch(saveCustomNodesList(ownProps.currencyCode, nodesList))
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrencySettings)
