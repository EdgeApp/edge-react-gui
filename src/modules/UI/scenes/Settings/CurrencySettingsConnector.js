// @flow

import { connect } from 'react-redux'

import { CURRENCY_PLUGIN_NAMES } from '../../../../constants/indexConstants.js'
import { getAccount } from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import { disableCustomNodes, enableCustomNodes, saveCustomNodesList, setDenominationKeyRequest, updateIsSetCustomNodesModalVisible } from './action'
import CurrencySettings from './CurrencySettings.ui'

const mapStateToProps = (state: State, ownProps) => {
  const account = getAccount(state)
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[ownProps.currencyCode]
  const currencyPlugin = account.currencyTools[currencyPluginName]
  const defaultCurrencySettings = currencyPlugin.currencyInfo.defaultSettings
  const defaultElectrumServer = defaultCurrencySettings.electrumServers ? defaultCurrencySettings.electrumServers[0] : ''
  const customNodesSetting = state.ui.settings[ownProps.currencyCode].customNodes
  return {
    logo: SETTINGS_SELECTORS.getPluginInfo(state, ownProps.pluginName).symbolImage,
    denominations: SETTINGS_SELECTORS.getDenominations(state, ownProps.currencyCode),
    selectedDenominationKey: SETTINGS_SELECTORS.getDisplayDenominationKey(state, ownProps.currencyCode),
    isCustomNodesEnabled: (customNodesSetting && customNodesSetting.isEnabled) || false,
    customNodesList: (customNodesSetting && customNodesSetting.nodesList) || [],
    isSetCustomNodesModalVisible: state.ui.scenes.settings.isSetCustomNodesModalVisible,
    isSetCustomNodesProcessing: state.ui.scenes.settings.isSetCustomNodesProcessing,
    defaultElectrumServer
  }
}
const mapDispatchToProps = (dispatch: Dispatch, ownProps) => {
  return {
    selectDenomination: denominationKey => {
      dispatch(setDenominationKeyRequest(ownProps.currencyCode, denominationKey))
    },
    enableCustomNodes: () => {
      dispatch(enableCustomNodes(ownProps.currencyCode))
    },
    disableCustomNodes: () => {
      dispatch(disableCustomNodes(ownProps.currencyCode))
    },
    setCustomNodesModalVisibility: (visibility: boolean) => dispatch(updateIsSetCustomNodesModalVisible(visibility)),
    saveCustomNodesList: (nodesList: Array<string>) => dispatch(saveCustomNodesList(ownProps.currencyCode, nodesList))
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrencySettings)
