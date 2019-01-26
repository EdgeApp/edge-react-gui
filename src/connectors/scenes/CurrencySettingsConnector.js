// @flow

import type { EdgeCurrencyInfo } from 'edge-core-js'
import { connect } from 'react-redux'

import { disableCustomNodes, enableCustomNodes, saveCustomNodesList, setDenominationKeyRequest } from '../../actions/SettingsActions'
import CurrencySettings from '../../components/scenes/CurrencySettingsScene'
import { CURRENCY_PLUGIN_NAMES } from '../../constants/indexConstants.js'
import { getAccount, getCurrencyInfo } from '../../modules/Core/selectors.js'
import type { Dispatch, State } from '../../modules/ReduxTypes.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'

const mapStateToProps = (state: State, ownProps) => {
  const account = getAccount(state)
  const currencyPluginName = CURRENCY_PLUGIN_NAMES[ownProps.currencyCode]
  const currencyPlugin = account.currencyConfig[currencyPluginName]
  const defaultCurrencySettings = currencyPlugin.currencyInfo.defaultSettings
  const defaultElectrumServer = defaultCurrencySettings.electrumServers ? defaultCurrencySettings.electrumServers[0] : ''
  const userSettings = currencyPlugin.userSettings
  const electrumServers = userSettings ? userSettings.electrumServers : []
  const disableFetchingServers = userSettings ? userSettings.disableFetchingServers : false
  const currencyInfo: EdgeCurrencyInfo = getCurrencyInfo(state, currencyPluginName)
  return {
    logo: currencyInfo.symbolImage,
    denominations: SETTINGS_SELECTORS.getDenominations(state, ownProps.currencyCode),
    selectedDenominationKey: SETTINGS_SELECTORS.getDisplayDenominationKey(state, ownProps.currencyCode),
    electrumServers,
    disableFetchingServers,
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
    saveCustomNodesList: (nodesList: Array<string>) => dispatch(saveCustomNodesList(ownProps.currencyCode, nodesList))
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrencySettings)
