// @flow

import { connect } from 'react-redux'
import { CurrencySettingsTitle } from './CurrencySettingsTitle.ui.js'
import type { CurrencySettingsTitleOwnProps } from './CurrencySettingsTitle.ui.js'
import type { State } from '../../../../modules/ReduxTypes.js'

const mapStateToProps = (state: State, ownProps: CurrencySettingsTitleOwnProps) => {
  const plugins = state.ui.settings.plugins || null
  return {
    plugins
  }
}

const mapDispatchToProps = () => {
  return {

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CurrencySettingsTitle)
