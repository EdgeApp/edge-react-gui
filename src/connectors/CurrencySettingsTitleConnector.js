// @flow
import type { EdgeCurrencyInfo } from 'edge-core-js'
import { connect } from 'react-redux'

import type { CurrencySettingsTitleOwnProps } from '../components/common/CurrencySettingsTitle.js'
import { CurrencySettingsTitle } from '../components/common/CurrencySettingsTitle.js'
import { getPluginInfo } from '../modules/Settings/selectors.js'
import type { State } from '../types/reduxTypes.js'

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
