// @flow

import { connect } from 'react-redux'
import { CurrencySettingsTitle } from './CurrencySettingsTitle.ui.js'
import type { CurrencySettingsTitleOwnProps } from './CurrencySettingsTitle.ui.js'
import type { State } from '../../../../modules/ReduxTypes.js'
import type { EdgeCurrencyPlugin } from 'edge-core-js'

const mapStateToProps = (state: State, ownProps: CurrencySettingsTitleOwnProps) => {
  const plugin: EdgeCurrencyPlugin = state.ui.settings.plugins[ownProps.pluginName] || null
  return {
    plugin
  }
}

const mapDispatchToProps = () => {
  return {

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CurrencySettingsTitle)
