// @flow

import type { EdgeCurrencyInfo } from 'edge-core-js'
import { connect } from 'react-redux'

import type { State } from '../../../../modules/ReduxTypes.js'
import { getPluginInfo } from '../../Settings/selectors.js'
import { CurrencySettingsTitle } from './CurrencySettingsTitle.ui.js'
import type { CurrencySettingsTitleOwnProps } from './CurrencySettingsTitle.ui.js'

const mapStateToProps = (state: State, ownProps: CurrencySettingsTitleOwnProps) => {
  const currencyInfo: EdgeCurrencyInfo = getPluginInfo(state, ownProps.pluginName)
  return {
    logo: currencyInfo.symbolImage || ''
  }
}

const mapDispatchToProps = () => {
  return {}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrencySettingsTitle)
