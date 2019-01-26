// @flow
import type { EdgeCurrencyInfo } from 'edge-core-js'
import { connect } from 'react-redux'

import { CurrencySettingsTitle } from '../components/common/CurrencySettingsTitle.js'
import type { CurrencySettingsTitleOwnProps } from '../components/common/CurrencySettingsTitle.js'
import { getCurrencyInfo } from '../modules/Core/selectors.js'
import type { State } from '../modules/ReduxTypes.js'

const mapStateToProps = (state: State, ownProps: CurrencySettingsTitleOwnProps) => {
  const currencyInfo: EdgeCurrencyInfo = getCurrencyInfo(state, ownProps.pluginName.toLowerCase())
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
