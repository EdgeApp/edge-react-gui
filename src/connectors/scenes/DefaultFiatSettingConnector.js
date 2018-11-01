// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { setDefaultFiatRequest } from '../../actions/SettingsActions'
import DefaultFiatSetting from '../../components/scenes/DefaultFiatSettingScene'
import type { Dispatch, State } from '../../modules/ReduxTypes.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import * as UTILS from '../../util/utils'

const mapStateToProps = (state: State) => ({
  defaultFiat: SETTINGS_SELECTORS.getDefaultFiat(state),
  supportedFiats: UTILS.getSupportedFiats(),
  dimensions: state.ui.scenes.dimensions
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSelectFiat: selectedDefaultFiat => {
    dispatch(setDefaultFiatRequest(selectedDefaultFiat))
    Actions.pop()
  }
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DefaultFiatSetting)
