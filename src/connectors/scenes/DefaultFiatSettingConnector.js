// @flow

import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { setDefaultFiatRequest } from '../../actions/SettingsActions'
import DefaultFiatSetting from '../../components/scenes/DefaultFiatSettingScene'
import type { Dispatch, State } from '../../modules/ReduxTypes.js'
import { getDefaultFiat } from '../../modules/Settings/selectors'
import { getSupportedFiats } from '../../util/utils'

const mapStateToProps = (state: State) => {
  const defaultFiat = getDefaultFiat(state)
  const supportedFiats = getSupportedFiats(defaultFiat)
  const out = {
    defaultFiat,
    supportedFiats
  }
  return out
}

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
